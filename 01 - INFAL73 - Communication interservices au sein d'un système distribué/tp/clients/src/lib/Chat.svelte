<script>
  import { openChat } from '../api/chat.js';
  import { formatTime } from './status.js';

  // parcelId : colis de la conversation ; role : 'client' ou 'courier'
  // optional : ne rien afficher tant que le service de chat n'a pas répondu (écran Client avant le TP 5)
  let { parcelId, role, optional = false } = $props();

  // Nom affiché pour chaque auteur de message
  const AUTHORS = { client: 'Client', courier: 'Livreur' };

  // État de la conversation : connexion, messages, saisie en cours
  let status = $state('connecting');
  let opened = $state(false);
  let messages = $state([]);
  let draft = $state('');
  let chat;

  // Numéro du colis recopié : la connexion ne dépend que de sa valeur, pas de la fiche qui la porte
  // (sans cela, chaque rafraîchissement de la fiche rouvrirait la connexion)
  const id = $derived(parcelId);

  // Connexion ouverte à l'affichage, refermée quand le colis change ou que l'écran disparaît
  $effect(() => {
    messages = [];
    opened = false;
    chat = openChat(
      id,
      role,
      (message) => { messages = [...messages, message]; },
      (value) => {
        status = value;
        if (value === 'open') {
          opened = true;
        }
      },
    );
    return () => chat.close();
  });

  // Envoi : le serveur ne renvoie pas le message à son auteur, il est donc ajouté ici
  function submit(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) {
      return;
    }
    chat.send(text);
    messages = [...messages, { from: role, text, at: new Date().toISOString() }];
    draft = '';
  }
</script>

{#if !optional || opened}
  <article class="card stack chat">
    <h3>Conversation avec {role === 'client' ? 'le livreur' : 'le client'}</h3>
    <!-- État de la connexion -->
    {#if status === 'connecting'}
      <p class="muted">Connexion au chat…</p>
    {:else if status === 'closed'}
      <p class="error" role="alert">Chat indisponible : connexion fermée.</p>
    {/if}
    <!-- Messages reçus et envoyés ; aria-live annonce les nouveaux -->
    <ol class="messages" aria-live="polite">
      {#each messages as message, index (index)}
        {#if message.from === 'system'}
          <li class="system muted">{message.text}</li>
        {:else}
          <li class:mine={message.from === role}>
            <span class="author">{AUTHORS[message.from] ?? message.from}</span>
            <span class="muted mono">{formatTime(message.at)}</span>
            <p>{message.text}</p>
          </li>
        {/if}
      {/each}
    </ol>
    <!-- Saisie d'un message -->
    <form onsubmit={submit}>
      <label class="sr-only" for="chat-{role}">Message</label>
      <input id="chat-{role}" bind:value={draft} autocomplete="off" maxlength="500" placeholder="Votre message" disabled={status !== 'open'} />
      <button type="submit" disabled={status !== 'open'}>Envoyer</button>
    </form>
  </article>
{/if}

<style>
  h3 {
    margin: 0;
  }
  .messages {
    display: grid;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .messages li {
    max-width: 80%;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    background: var(--surface-2);
  }
  .messages li.mine {
    justify-self: end;
    border: 1px solid var(--accent);
  }
  .messages li.system {
    justify-self: center;
    background: none;
    font-size: 0.9rem;
  }
  .author {
    font-weight: 600;
    margin-right: 0.5rem;
  }
  .messages p {
    margin: 0.25rem 0 0;
  }
  .error {
    color: var(--danger);
  }
  form {
    display: flex;
    gap: 0.75rem;
  }
  input {
    flex: 1;
  }
</style>
