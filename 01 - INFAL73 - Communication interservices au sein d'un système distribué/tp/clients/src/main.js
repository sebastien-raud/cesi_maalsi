import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';

// Point d'entrée : affiche l'application dans l'élément #app de index.html
mount(App, { target: document.getElementById('app') });
