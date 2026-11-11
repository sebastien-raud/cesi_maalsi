// Sans import de @slidev/types (defineShikiSetup n'est qu'une fonction identité) :
// le thème est chargé depuis un dossier sans node_modules.
export default () => ({
  themes: {
    dark: 'vitesse-dark',
    light: 'vitesse-light',
  },
})
