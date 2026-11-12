<script>
  import Central from './routes/Central.svelte';
  import Courier from './routes/Courier.svelte';
  import Merchant from './routes/Merchant.svelte';
  import Tracking from './routes/Tracking.svelte';

  // Un écran par acteur du fil rouge, choisi par l'ancre de l'URL (#/client, #/central...)
  const routes = [
    { hash: '#/client', label: 'Client', component: Tracking },
    { hash: '#/livreur', label: 'Livreur', component: Courier },
    { hash: '#/central', label: 'Central', component: Central },
    { hash: '#/marchand', label: 'Marchand', component: Merchant },
  ];

  // Ancre courante, et zone principale qui reçoit le focus
  let hash = $state(location.hash || routes[0].hash);
  let main;

  // Écran affiché ; une ancre inconnue ramène au premier écran
  const current = $derived(routes.find((route) => route.hash === hash) ?? routes[0]);

  // Titre de l'onglet tenu à jour selon l'écran
  $effect(() => {
    document.title = `${current.label} · Colibri`;
  });

  // Appelée par le navigateur quand l'ancre de l'URL change
  function onHashChange() {
    hash = location.hash;
    // Changement d'écran : le focus va au contenu, pour le clavier et les lecteurs d'écran
    main.focus();
  }
</script>

<svelte:window onhashchange={onHashChange} />

<!-- En-tête : nom de l'application et menu des écrans -->
<header>
  <p class="brand"><span aria-hidden="true">🐦</span> Colibri</p>
  <nav aria-label="Écrans">
    <ul>
      {#each routes as route (route.hash)}
        <li>
          <a href={route.hash} aria-current={route === current ? 'page' : undefined}>{route.label}</a>
        </li>
      {/each}
    </ul>
  </nav>
</header>

<!-- Écran courant -->
<main bind:this={main} tabindex="-1">
  <current.component />
</main>

<style>
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 2rem;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .brand {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  ul {
    display: flex;
    gap: 0.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  nav a {
    display: block;
    padding: 0.4rem 0.9rem;
    border-radius: 8px;
    color: var(--muted);
    text-decoration: none;
    font-weight: 600;
  }
  nav a:hover {
    color: var(--text);
    background: var(--surface-2);
  }
  nav a[aria-current='page'] {
    color: var(--accent);
    background: var(--surface-2);
  }
  main {
    max-width: 60rem;
    margin: 0 auto;
    padding: 2rem;
  }
  main:focus {
    outline: none;
  }
</style>
