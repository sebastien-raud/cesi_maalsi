<script>
  import { chatEnabled } from '../api/chat.js';
  import { watchParcel } from '../api/events.js';
  import { followLink, getParcel } from '../api/parcels.js';
  import Chat from '../lib/Chat.svelte';
  import ErrorAlert from '../lib/ErrorAlert.svelte';
  import StatusBadge from '../lib/StatusBadge.svelte';
  import { formatDate, formatTime } from '../lib/status.js';

  // Libellés des actions connues de la v2 ; une action inconnue s'affiche sous son nom de lien
  const ACTIONS = {
    start: 'Mettre en livraison',
    deliver: 'Marquer livré',
    reschedule: 'Reprogrammer la livraison',
    'relay-point': 'Livrer en point relais',
  };

  // Libellés des options de livraison choisies par le client (v2)
  const DELIVERY_OPTIONS = {
    RESCHEDULED: 'Livraison reprogrammée',
    RELAY_POINT: 'Point relais',
  };

  // État de l'écran : saisie, version choisie, dernier résultat ou dernière erreur
  let parcelId = $state('CLB-0003');
  let version = $state('v1');
  let parcel = $state();
  let error = $state();
  let loading = $state(false);

  // Colis suivi en direct (v2) et événements reçus de son flux
  let watchedId = $state();
  let events = $state([]);

  // Actions proposées par le serveur (v2) : tous les liens sauf self
  const actions = $derived(Object.entries(parcel?._links ?? {}).filter(([rel]) => rel !== 'self'));

  // Flux SSE du colis suivi (v2) : chaque événement s'ajoute à la liste et rafraîchit la fiche (statut, liens)
  // Le flux se ferme quand on change de colis, de version ou d'écran
  $effect(() => {
    if (version !== 'v2' || !watchedId) {
      return;
    }
    const id = watchedId;
    events = [];
    return watchParcel(id, (event) => {
      events = [...events, event];
      getParcel('v2', id).then((fresh) => { parcel = fresh; }, () => {});
    });
  });

  // Lance un appel à l'API et range le colis reçu, ou l'erreur
  async function run(call) {
    loading = true;
    error = undefined;
    try {
      parcel = await call();
    } catch (e) {
      parcel = undefined;
      error = e;
    } finally {
      loading = false;
    }
  }

  // Envoi du formulaire : recherche du colis dans la version choisie
  function track(event) {
    event.preventDefault();
    watchedId = parcelId.trim();
    run(() => getParcel(version, watchedId));
  }

  // Clic sur une action v2 : le client suit le lien reçu du serveur
  function act(link) {
    run(() => followLink(link));
  }
</script>

<h1>Suivre mon colis</h1>

<!-- Recherche : numéro de colis et version de l'API -->
<form class="card search" onsubmit={track}>
  <div class="field">
    <label for="parcel-id">Numéro de colis</label>
    <input id="parcel-id" class="mono" bind:value={parcelId} required autocomplete="off" placeholder="CLB-0001" />
  </div>
  <fieldset>
    <legend>Version de l'API</legend>
    <label><input type="radio" bind:group={version} value="v1" /> v1</label>
    <label><input type="radio" bind:group={version} value="v2" /> v2 (HATEOAS)</label>
  </fieldset>
  <button type="submit" disabled={loading}>Suivre</button>
</form>

<!-- Résultat : erreur ou fiche du colis ; aria-live annonce le changement -->
<section class="result" aria-live="polite" aria-busy={loading}>
  {#if error}
    <ErrorAlert {error} />
  {:else if parcel}
    <article class="card stack">
      <header class="head">
        <h2 class="mono">{parcel.id}</h2>
        <StatusBadge status={parcel.status} />
      </header>
      <dl>
        <dt>Destinataire</dt>
        <dd>{parcel.recipient}</dd>
        <dt>Adresse</dt>
        <dd>{parcel.address.street}, {parcel.address.postalCode} {parcel.address.city}</dd>
        <!-- Coordonnées GPS, présentes seulement une fois l'adresse géocodée (TP 6) -->
        {#if parcel.location}
          <dt>Coordonnées</dt>
          <dd class="mono">{parcel.location.latitude}, {parcel.location.longitude}</dd>
        {/if}
        <dt>Marchand</dt>
        <dd>{parcel.merchant}</dd>
        <!-- Option de livraison, présente seulement après une action reschedule ou relay-point -->
        {#if parcel.deliveryOption}
          <dt>Option de livraison</dt>
          <dd>{DELIVERY_OPTIONS[parcel.deliveryOption] ?? parcel.deliveryOption}</dd>
        {/if}
        <dt>Dernière mise à jour</dt>
        <dd>{formatDate(parcel.updatedAt)}</dd>
      </dl>
      <!-- v2 seulement : une action par lien proposé par le serveur -->
      {#if version === 'v2'}
        {#if actions.length > 0}
          <div class="actions">
            {#each actions as [rel, link] (rel)}
              <button type="button" class="secondary" onclick={() => act(link)} disabled={loading}>
                {ACTIONS[rel] ?? rel}
              </button>
            {/each}
          </div>
        {:else}
          <p class="muted">Aucune action proposée par le serveur pour ce colis.</p>
        {/if}
      {/if}
    </article>
    <!-- v2 seulement : étapes reçues en direct par le flux SSE (TP 3) -->
    {#if version === 'v2' && events.length > 0}
      <article class="card">
        <h3>Suivi en direct</h3>
        <ol class="events" aria-live="polite">
          {#each events as event, index (index)}
            <li><span class="muted mono">{formatTime(event.at)}</span> {event.label}</li>
          {/each}
        </ol>
      </article>
    {/if}
    <!-- Chat avec le livreur (TP 5) : seulement si le TP a un service de chat, et affiché quand il répond -->
    {#if chatEnabled}
      {#key parcel.id}
        <Chat parcelId={parcel.id} role="client" optional />
      {/key}
    {/if}
  {/if}
</section>

<style>
  .search {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 1.5rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  fieldset {
    display: flex;
    gap: 1rem;
    margin: 0;
    padding: 0;
    border: 0;
  }
  legend {
    margin-bottom: 0.35rem;
  }
  fieldset label {
    font-weight: 400;
  }
  .result {
    margin-top: 1.5rem;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .head h2 {
    margin: 0;
  }
  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.5rem 1.5rem;
    margin-bottom: 0;
  }
  dt {
    color: var(--muted);
  }
  dd {
    margin: 0;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  /* :global, pour espacer aussi le chat, rendu par un autre composant */
  .result > :global(* + *) {
    margin-top: 1rem;
  }
  h3 {
    margin-top: 0;
  }
  .events {
    display: grid;
    gap: 0.4rem;
    margin: 0;
    padding-left: 1.25rem;
  }
</style>
