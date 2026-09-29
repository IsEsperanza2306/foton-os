# pedido-correo

Manda el pedido a admon.ventas con el Formato de Pedido (Excel oficial) adjunto, justo después de registrarlo en el portal.

## Encender (una sola vez)
1. Hilo de infraestructura: cuenta de Resend con el dominio remitente verificado.
2. Secretos en Supabase (Project Settings → Edge Functions → Secrets): `RESEND_API_KEY`, `MAIL_FROM`. Opcionales: `MAIL_TO`, `MAIL_CC_FIJO`, `ALLOWED_ORIGINS`.
3. Desplegar: `supabase functions deploy pedido-correo --project-ref gblwoaaitnqbgorxaydv`.
4. Probar con un pedido de prueba y, cuando llegue bien, poner `PEDIDO_CORREO: true` en `_config.js`.

## Apagar
`PEDIDO_CORREO: false` en `_config.js`. El portal vuelve al flujo manual (descarga + abrir correo). Si la función falla, el portal también cae solo al flujo manual.

## Seguridad
El PIN se valida con `fn_pedido_lista`; solo se manda un pedido que pertenezca a ese PIN, con asunto y cuerpo armados desde la base. El Excel adjunto es el que genera el portal sobre la plantilla oficial.
