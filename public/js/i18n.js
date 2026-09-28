// Dicionário de idiomas do ProPresenter 7 Remote — compartilhado pelas peles mobile e desktop.
// Escopo desta primeira versão: cabeçalho, menus, botões comuns, títulos dos módulos e as
// Configurações. Os textos gerados dinamicamente dentro de app.js (toasts, status ao vivo) ainda
// ficam em português nesta etapa — ver issue #1 no GitHub para o acompanhamento do restante.
(function (global) {
  const DICT = {
    'pt-BR': {
      buscar_placeholder: 'Buscar em 4.500+ músicas e letras...',
      aparencia: 'Aparência',
      anterior: 'Anterior',
      mostrar: 'Mostrar',
      proximo: 'Próximo',
      limpar: 'Limpar',
      conectado: 'Conectado',
      sem_conexao: 'Sem conexão',
      configuracoes: 'Configurações',
      playlist: 'PLAYLIST',
      biblioteca: 'BIBLIOTECA',
      itens: 'ITENS',
      audio: 'Áudio',
      palco: 'Palco',
      temporizadores: 'Temporizadores',
      mensagens: 'Mensagens',
      props: 'Props',
      video: 'Vídeo',
      captura: 'Captura',
      macros: 'Macros',
      add_playlist: 'Add à Playlist',
      mudar_retornos: 'Mudar Retornos Plataforma juntos',
      aplicar_layout: 'Aplicar layout',
      mensagem_palco: 'Mensagem de Palco',
      iniciar_gravacao: 'Iniciar Gravação',
      parar_gravacao: 'Parar Gravação',
      cfg_titulo: 'Configurações de Conexão',
      cfg_ip: 'IP do ProPresenter 7:',
      cfg_porta: 'Porta da API:',
      cfg_idioma: 'Idioma:',
      cfg_salvar: 'Salvar e Reconectar',
      cfg_idioma_auto: 'Automático (idioma do aparelho)',
      cfg_meu_idioma: 'Meu idioma neste aparelho:',
      config_titulo_curto: 'Configurações',
      reordenar_dica: 'Arraste ou use ▲▼ para reordenar (grava no ProPresenter)',
      mover_cima: 'Mover para cima',
      mover_baixo: 'Mover para baixo',
      preview_editor: 'Clique numa música da playlist para ver as letras/slides',
      pastas_midia: 'Pastas / Mídia',
      ao_vivo: 'AO VIVO',
      nada_no_ar: 'Nada no ar',
      carregando: 'Carregando...',
      pesquisar: 'Pesquisar',
      abrir_busca: 'Abrir',
    },
    en: {
      buscar_placeholder: 'Search 4,500+ songs and lyrics...',
      aparencia: 'Look',
      anterior: 'Previous',
      mostrar: 'Show',
      proximo: 'Next',
      limpar: 'Clear',
      conectado: 'Connected',
      sem_conexao: 'No connection',
      configuracoes: 'Settings',
      playlist: 'PLAYLIST',
      biblioteca: 'LIBRARY',
      itens: 'ITEMS',
      audio: 'Audio',
      palco: 'Stage',
      temporizadores: 'Timers',
      mensagens: 'Messages',
      props: 'Props',
      video: 'Video',
      captura: 'Capture',
      macros: 'Macros',
      add_playlist: 'Add to Playlist',
      mudar_retornos: 'Change platform monitors together',
      aplicar_layout: 'Apply layout',
      mensagem_palco: 'Stage Message',
      iniciar_gravacao: 'Start Recording',
      parar_gravacao: 'Stop Recording',
      cfg_titulo: 'Connection Settings',
      cfg_ip: 'ProPresenter 7 IP:',
      cfg_porta: 'API Port:',
      cfg_idioma: 'Language:',
      cfg_salvar: 'Save and Reconnect',
      cfg_idioma_auto: 'Automatic (device language)',
      cfg_meu_idioma: 'My language on this device:',
      config_titulo_curto: 'Settings',
      reordenar_dica: 'Drag or use ▲▼ to reorder (saves to ProPresenter)',
      mover_cima: 'Move up',
      mover_baixo: 'Move down',
      preview_editor: 'Click a song in the playlist to see the lyrics/slides',
      pastas_midia: 'Folders / Media',
      ao_vivo: 'LIVE',
      nada_no_ar: 'Nothing on air',
      carregando: 'Loading...',
      pesquisar: 'Search',
      abrir_busca: 'Open',
    },
    es: {
      buscar_placeholder: 'Buscar en más de 4.500 canciones y letras...',
      aparencia: 'Apariencia',
      anterior: 'Anterior',
      mostrar: 'Mostrar',
      proximo: 'Siguiente',
      limpar: 'Limpiar',
      conectado: 'Conectado',
      sem_conexao: 'Sin conexión',
      configuracoes: 'Configuración',
      playlist: 'LISTA',
      biblioteca: 'BIBLIOTECA',
      itens: 'ELEMENTOS',
      audio: 'Audio',
      palco: 'Escenario',
      temporizadores: 'Temporizadores',
      mensagens: 'Mensajes',
      props: 'Props',
      video: 'Vídeo',
      captura: 'Captura',
      macros: 'Macros',
      add_playlist: 'Añadir a la Lista',
      mudar_retornos: 'Cambiar monitores de plataforma juntos',
      aplicar_layout: 'Aplicar diseño',
      mensagem_palco: 'Mensaje de Escenario',
      iniciar_gravacao: 'Iniciar Grabación',
      parar_gravacao: 'Detener Grabación',
      cfg_titulo: 'Configuración de Conexión',
      cfg_ip: 'IP del ProPresenter 7:',
      cfg_porta: 'Puerto de la API:',
      cfg_idioma: 'Idioma:',
      cfg_salvar: 'Guardar y Reconectar',
      cfg_idioma_auto: 'Automático (idioma del dispositivo)',
      cfg_meu_idioma: 'Mi idioma en este dispositivo:',
      config_titulo_curto: 'Configuración',
      reordenar_dica: 'Arrastra o usa ▲▼ para reordenar (guarda en ProPresenter)',
      mover_cima: 'Subir',
      mover_baixo: 'Bajar',
      preview_editor: 'Haz clic en una canción de la lista para ver las letras/diapositivas',
      pastas_midia: 'Carpetas / Medios',
      ao_vivo: 'EN VIVO',
      nada_no_ar: 'Nada al aire',
      carregando: 'Cargando...',
      pesquisar: 'Buscar',
      abrir_busca: 'Abrir',
    },
  };

  const SUPORTADOS = Object.keys(DICT);
  const CHAVE_LOCAL = 'propresenter_remote_idioma';

  function normalizar(tag) {
    if (!tag) return null;
    tag = String(tag).toLowerCase();
    if (tag.startsWith('pt')) return 'pt-BR';
    if (tag.startsWith('es')) return 'es';
    if (tag.startsWith('en')) return 'en';
    return null;
  }

  // Ordem: escolha do usuário neste aparelho > padrão do servidor (config.json) > idioma do
  // navegador > pt-BR. server-info é opcional (passe o objeto já lido, se tiver, para não duplicar
  // a chamada de rede).
  function detectar(serverInfo) {
    const escolhaUsuario = normalizar(localStorage.getItem(CHAVE_LOCAL));
    if (escolhaUsuario) return escolhaUsuario;
    const padraoServidor = normalizar(serverInfo && serverInfo.language);
    if (padraoServidor) return padraoServidor;
    const doNavegador = normalizar(navigator.language || (navigator.languages && navigator.languages[0]));
    if (doNavegador) return doNavegador;
    return 'pt-BR';
  }

  function t(chave, idioma) {
    const dic = DICT[idioma] || DICT['pt-BR'];
    return (chave in dic) ? dic[chave] : (DICT['pt-BR'][chave] || chave);
  }

  function aplicar(idioma) {
    document.documentElement.lang = idioma;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const chave = el.getAttribute('data-i18n');
      el.textContent = t(chave, idioma);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'), idioma));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title'), idioma));
    });
  }

  function definirEscolhaUsuario(idioma) {
    if (SUPORTADOS.includes(idioma)) localStorage.setItem(CHAVE_LOCAL, idioma);
    else localStorage.removeItem(CHAVE_LOCAL);
  }

  global.I18N = { t, aplicar, detectar, SUPORTADOS, definirEscolhaUsuario, CHAVE_LOCAL };
})(window);
