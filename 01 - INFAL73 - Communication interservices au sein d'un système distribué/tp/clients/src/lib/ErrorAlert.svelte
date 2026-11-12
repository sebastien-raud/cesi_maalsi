<script>
  import { ApiError } from '../api/parcels.js';

  // Affiche une erreur : code HTTP, titre et détail du format problème
  let { error } = $props();

  // Champs extraits de l'erreur ; status 0 (service injoignable) n'est pas affiché
  const title = $derived(error instanceof Error ? error.message : 'Erreur inattendue');
  const status = $derived(error instanceof ApiError && error.status > 0 ? error.status : undefined);
  const detail = $derived(error instanceof ApiError ? error.detail : undefined);
</script>

<!-- role="alert" : le message est lu dès son apparition -->
<div class="alert" role="alert">
  <p class="title">
    {#if status}<span class="code">{status}</span>{/if}
    {title}
  </p>
  {#if detail}<p class="detail">{detail}</p>{/if}
</div>

<style>
  .alert {
    border: 1px solid var(--danger);
    border-left-width: 4px;
    border-radius: var(--radius);
    padding: 0.75rem 1rem;
    background: var(--danger-bg);
  }
  .title { margin: 0; font-weight: 600; }
  .code {
    font-family: var(--mono);
    color: var(--danger);
    margin-right: 0.5em;
  }
  .detail { margin: 0.25rem 0 0; color: var(--muted); }
</style>
