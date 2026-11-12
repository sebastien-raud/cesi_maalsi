<script>
  import { getQuote } from '../api/parcels.js';
  import ErrorAlert from '../lib/ErrorAlert.svelte';

  // Saisie du devis
  let postalCode = $state('69003');
  let weightKg = $state(3);
  let express = $state(false);

  // Dernier devis reçu, ou dernière erreur ; durée de la dernière demande
  let quote = $state();
  let error = $state();
  let loading = $state(false);
  let elapsedMs = $state();

  // Prix affiché en euros, à la française : « 7,30 € »
  const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

  // Envoi du formulaire : demande du prix au service colis, qui interroge la tarification par messages
  async function submit(event) {
    event.preventDefault();
    loading = true;
    error = undefined;
    quote = undefined;
    const start = performance.now();
    try {
      quote = await getQuote({ postalCode: postalCode.trim(), weightKg, express });
    } catch (e) {
      error = e;
    } finally {
      elapsedMs = Math.round(performance.now() - start);
      loading = false;
    }
  }
</script>

<h1>Prix d'une livraison</h1>

<!-- Devis : destination, poids, option express -->
<form class="card quote" onsubmit={submit}>
  <div class="field">
    <label for="quote-postal-code">Code postal</label>
    <input id="quote-postal-code" class="mono" bind:value={postalCode} required inputmode="numeric" pattern="[0-9]{'{'}5{'}'}" autocomplete="off" />
  </div>
  <div class="field">
    <label for="quote-weight">Poids (kg)</label>
    <input id="quote-weight" type="number" bind:value={weightKg} required min="0.1" max="30" step="0.1" />
  </div>
  <label class="check"><input type="checkbox" bind:checked={express} /> Express</label>
  <button type="submit" disabled={loading}>Calculer le prix</button>
</form>

<!-- Résultat : erreur ou prix ; aria-live annonce le changement -->
<section class="result" aria-live="polite" aria-busy={loading}>
  {#if loading}
    <p class="muted">Demande envoyée au service de tarification…</p>
  {:else if error}
    <ErrorAlert {error} />
  {:else if quote}
    <article class="card">
      <p class="price">{euros.format(quote.price)}</p>
      <p class="muted">
        Livraison {quote.express ? 'express' : 'standard'} de {quote.weightKg.toLocaleString('fr-FR')} kg vers le {quote.postalCode}
      </p>
    </article>
  {/if}
  {#if elapsedMs !== undefined && !loading}
    <p class="muted">Réponse en {elapsedMs} ms</p>
  {/if}
</section>

<style>
  .quote {
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
  #quote-weight {
    width: 7rem;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
  }
  .result {
    margin-top: 1.5rem;
  }
  .result > :global(* + *) {
    margin-top: 1rem;
  }
  .price {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    color: var(--accent);
  }
</style>
