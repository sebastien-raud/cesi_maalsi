<script>
  import { changeStatus, listParcels } from '../api/parcels.js';
  import ErrorAlert from '../lib/ErrorAlert.svelte';
  import StatusBadge from '../lib/StatusBadge.svelte';
  import { STATUS } from '../lib/status.js';

  // v1 : le client doit connaître lui-même les transitions possibles.
  // Cette règle métier est dupliquée côté client : c'est ce que HATEOAS (v2) évite.
  const NEXT = {
    READY: { status: 'IN_TRANSIT', label: 'Mettre en livraison' },
    IN_TRANSIT: { status: 'DELIVERED', label: 'Marquer livré' },
  };

  // État de l'écran : filtre choisi ('' = tous), colis affichés, dernière erreur
  let filter = $state('');
  let parcels = $state([]);
  let error = $state();
  let loading = $state(false);

  // Charge la liste des colis, filtrée par statut
  async function load() {
    loading = true;
    error = undefined;
    try {
      parcels = await listParcels(filter || undefined);
    } catch (e) {
      parcels = [];
      error = e;
    } finally {
      loading = false;
    }
  }

  // Fait passer un colis au statut suivant, puis recharge la liste
  async function advance(parcel, status) {
    error = undefined;
    try {
      await changeStatus(parcel.id, status);
      await load();
    } catch (e) {
      error = e;
    }
  }

  // Recharge à l'ouverture de l'écran et à chaque changement de filtre
  $effect(() => {
    filter;
    load();
  });
</script>

<h1>Central · colis</h1>

<!-- Barre d'outils : filtre par statut et actualisation -->
<div class="toolbar">
  <label for="status-filter">Statut</label>
  <select id="status-filter" bind:value={filter}>
    <option value="">Tous</option>
    {#each Object.entries(STATUS) as [status, { label }] (status)}
      <option value={status}>{label}</option>
    {/each}
  </select>
  <button type="button" class="secondary" onclick={load} disabled={loading}>Actualiser</button>
</div>

<!-- Zone d'erreur, annoncée aux lecteurs d'écran -->
<div aria-live="polite">
  {#if error}
    <ErrorAlert {error} />
  {/if}
</div>

<!-- Tableau des colis, avec le bouton du statut suivant -->
<div class="card table-wrap">
  <table aria-busy={loading}>
    <caption class="sr-only">Liste des colis</caption>
    <thead>
      <tr>
        <th scope="col">Numéro</th>
        <th scope="col">Destinataire</th>
        <th scope="col">Ville</th>
        <th scope="col">Statut</th>
        <th scope="col"><span class="sr-only">Action</span></th>
      </tr>
    </thead>
    <tbody>
      {#each parcels as parcel (parcel.id)}
        {@const next = NEXT[parcel.status]}
        <tr>
          <td class="mono">{parcel.id}</td>
          <td>{parcel.recipient}</td>
          <td>{parcel.address.city}</td>
          <td><StatusBadge status={parcel.status} /></td>
          <td>
            {#if next}
              <button type="button" class="secondary small" onclick={() => advance(parcel, next.status)}>
                {next.label}<span class="sr-only"> : {parcel.id}</span>
              </button>
            {/if}
          </td>
        </tr>
      {:else}
        <tr><td colspan="5" class="muted">{loading ? 'Chargement…' : 'Aucun colis.'}</td></tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .table-wrap {
    margin-top: 1rem;
    padding: 0;
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    padding: 0.7rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }
  th {
    color: var(--muted);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  tbody tr:last-child td {
    border-bottom: 0;
  }
  .small {
    padding: 0.3rem 0.7rem;
    font-size: 0.875rem;
  }
</style>
