<script>
  import { STATUS } from './status.js';

  // Pastille de statut d'un colis : pictogramme, libellé et couleur
  let { status } = $props();
</script>

<!-- Le pictogramme est décoratif : le libellé suffit aux lecteurs d'écran -->

<span class="badge" data-status={status}>
  <span aria-hidden="true">{STATUS[status].icon}</span>
  {STATUS[status].label}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    padding: 0.2em 0.7em;
    border: 1px solid currentColor;
    border-radius: 999px;
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
  }
  [data-status='ADDRESS_PENDING'] { color: var(--status-pending); }
  [data-status='READY'] { color: var(--status-ready); }
  [data-status='IN_TRANSIT'] { color: var(--status-transit); }
  [data-status='DELIVERED'] { color: var(--status-delivered); }
</style>
