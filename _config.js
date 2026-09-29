window.FOTON_CONFIG = {
  SUPABASE_URL: 'https://gblwoaaitnqbgorxaydv.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibHdvYWFpdG5xYmdvcnhheWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTQ3NTMsImV4cCI6MjA5NTc3MDc1M30.o7zYCCfH2rHEs69o4U7Zc9dM4IvQi8GsXRlZFW_2kso',
  // Umami (lo entrega el hilo de infraestructura). Vacío = analítica apagada.
  UMAMI_SRC: '',            // p. ej. 'https://umami.tudominio.com/script.js'
  UMAMI_WEBSITE_ID: '',     // UUID del sitio en Umami
  UMAMI_DOMAINS: 'isesperanza2306.github.io',
  // Pedidos: true = el Excel oficial se manda solo a admon.ventas (función Edge pedido-correo).
  // false = flujo actual (descarga + abrir correo). Encender solo con la función desplegada y probada.
  PEDIDO_CORREO: false
};
