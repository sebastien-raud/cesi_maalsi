<script>
  import { chatEnabled } from '../api/chat.js';
  import Chat from '../lib/Chat.svelte';

  // Saisie du numéro de colis, et colis dont la conversation est ouverte
  let parcelId = $state('CLB-0003');
  let joinedId = $state();

  // Envoi du formulaire : le livreur rejoint la conversation du colis
  function join(event) {
    event.preventDefault();
    joinedId = parcelId.trim();
  }
</script>

<h1>Livreur</h1>

{#if !chatEnabled}
  <!-- Pas de service de chat dans ce TP : l'écran arrive au TP 5 -->
  <p class="card muted">🚧 Écran en préparation : le chat avec le client arrive au TP 5.</p>
{:else}
  <!-- Choix du colis dont on veut joindre le client -->
  <form class="card search" onsubmit={join}>
    <div class="field">
      <label for="courier-parcel-id">Numéro de colis</label>
      <input id="courier-parcel-id" class="mono" bind:value={parcelId} required autocomplete="off" placeholder="CLB-0001" />
    </div>
    <button type="submit">Rejoindre</button>
  </form>

  <!-- Conversation du colis choisi ; key recrée la connexion à chaque changement de colis -->
  {#if joinedId}
    {#key joinedId}
      <div class="chat">
        <Chat parcelId={joinedId} role="courier" />
      </div>
    {/key}
  {/if}
{/if}

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
  .chat {
    margin-top: 1.5rem;
  }
</style>
