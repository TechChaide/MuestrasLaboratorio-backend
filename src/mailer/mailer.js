const nodemailer = require('nodemailer');
const { getNombreEmpleado } = require('./empleados.helper');

// Mismo relay interno usado en otros sistemas de Chaide (ver
// procesosAuditoriasBackend/src/mailer/mailer.js). Configurable por .env
// (ya había placeholders EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASSWORD
// comentados) — si no hay usuario/clave, se asume un relay abierto interno
// sin autenticación, igual que el proyecto de referencia.
const EMAIL_HOST = process.env.EMAIL_HOST || '10.93.2.19';
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 25;
const EMAIL_FROM = process.env.EMAIL_FROM || 'informacion@chaideychaide.com';

const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: false,
    auth: (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD)
        ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
        : undefined,
    tls: {
        rejectUnauthorized: false,
    },
});

/** Convierte "correo1@x.com, correo2@x.com" en una lista limpia de correos
 * válidos. Devuelve [] si no hay nada aprovechable (el llamador debe
 * verificar antes de enviar). */
function parseCorreos(correos) {
    if (!correos || typeof correos !== 'string') return [];
    return correos
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0 && c.includes('@'));
}

function formatFecha(fecha) {
    if (!fecha) return 'N/A';
    try {
        return new Date(fecha).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return String(fecha);
    }
}

/** Envoltorio HTML común a las 4 notificaciones — mismo estilo visual que
 * procesosAuditoriasBackend/src/mailer/mailer.js (container blanco, header
 * con borde de color, footer), parametrizado por color de acento y título. */
function construirHtml({ colorAcento, titulo, cuerpoHtml, pieTexto }) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titulo}</title>
    <style>
        body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8f9fa;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 640px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            line-height: 1.6;
        }
        .header {
            border-bottom: 2px solid ${colorAcento};
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .content { margin: 20px 0; }
        .footer {
            border-top: 1px solid #e0e0e0;
            padding-top: 20px;
            margin-top: 30px;
            font-size: 14px;
            color: #666;
        }
        .highlight {
            background-color: #f0f8ff;
            padding: 2px 6px;
            border-radius: 3px;
        }
        .campo { margin: 4px 0; }
        .campo strong { display: inline-block; min-width: 160px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0; color: ${colorAcento};">${titulo}</h2>
        </div>
        <div class="content">
            ${cuerpoHtml}
        </div>
        <div class="footer">
            <p style="margin: 0;">${pieTexto || 'Este es un correo automático del Módulo de Ensayos de Laboratorio.'}</p>
        </div>
    </div>
</body>
</html>`;
}

async function enviarSiHayCorreos(correos, subject, html, logLabel, attachments) {
    const listaCorreos = parseCorreos(correos);
    if (listaCorreos.length === 0) return;

    try {
        await transporter.sendMail({
            from: EMAIL_FROM,
            to: listaCorreos.join(', '),
            subject,
            html,
            attachments: attachments && attachments.length ? attachments : undefined,
        });
        console.log(`${logLabel} enviado exitosamente a: ${listaCorreos.join(', ')}`);
    } catch (err) {
        console.error(`Error al enviar ${logLabel}:`, err);
        throw err;
    }
}

// 2.1 — Requerimientos de ensayos entrantes: avisa al equipo de laboratorio
// que llegó una nueva solicitud de ensayo (aún sin asignar).
async function enviarNotificacionRequerimientoEntrante(correos, solicitud) {
    const { identificador_ensayo, descripcion, fecha_fab_adq } = solicitud || {};

    const cuerpoHtml = `
        <p>Estimados,</p>
        <p>Se ha registrado un nuevo requerimiento de ensayo en el sistema, pendiente de asignación:</p>
        <div class="campo"><strong>Identificador:</strong> <span class="highlight">${identificador_ensayo || 'N/A'}</span></div>
        <div class="campo"><strong>Descripción:</strong> ${descripcion || 'N/A'}</div>
        <div class="campo"><strong>Fecha de fabricación/adquisición:</strong> ${formatFecha(fecha_fab_adq)}</div>
        <p style="margin-top: 20px;">Por favor ingrese al sistema para asignar el ensayo correspondiente.</p>
        <p>Saludos cordiales.</p>
    `;

    const html = construirHtml({
        colorAcento: '#007bff',
        titulo: 'Nuevo requerimiento de ensayo',
        cuerpoHtml,
    });

    await enviarSiHayCorreos(
        correos,
        `Nuevo requerimiento de ensayo - ${identificador_ensayo || ''}`.trim(),
        html,
        'Correo de requerimiento entrante'
    );
}

// 2.2 — Notificación de asignación de ensayo: avisa al responsable asignado
// (analista) las fechas y el tipo de ensayo a su cargo.
async function enviarNotificacionAsignacionEnsayo(correos, datos) {
    const { identificador_ensayo, nombre_tipo_ensayo, responsable_ensayo, fecha_inicio, fecha_fin } = datos || {};
    const nombreResponsable = await getNombreEmpleado(responsable_ensayo);

    const cuerpoHtml = `
        <p>Estimado/a ${nombreResponsable || ''},</p>
        <p>Se le ha asignado el siguiente ensayo:</p>
        <div class="campo"><strong>Identificador:</strong> <span class="highlight">${identificador_ensayo || 'N/A'}</span></div>
        <div class="campo"><strong>Tipo de ensayo:</strong> ${nombre_tipo_ensayo || 'N/A'}</div>
        <div class="campo"><strong>Responsable:</strong> ${nombreResponsable || 'N/A'}</div>
        <div class="campo"><strong>Fecha de inicio:</strong> ${formatFecha(fecha_inicio)}</div>
        <div class="campo"><strong>Fecha límite:</strong> ${formatFecha(fecha_fin)}</div>
        <p style="margin-top: 20px;">Ingrese al sistema, sección "Mis Ensayos Programados", para iniciar la captura de datos.</p>
        <p>Saludos cordiales.</p>
    `;

    const html = construirHtml({
        colorAcento: '#6f42c1',
        titulo: 'Ensayo asignado',
        cuerpoHtml,
    });

    await enviarSiHayCorreos(
        correos,
        `Ensayo asignado - ${identificador_ensayo || ''}`.trim(),
        html,
        'Correo de asignación de ensayo'
    );
}

// 2.3 — Notificación de culminación de fase de ensayos: avisa que la
// captura de datos llegó al 100% y está lista para revisión/aprobación.
async function enviarNotificacionCulminacionFase(correos, datos) {
    const { identificador_ensayo, nombre_tipo_ensayo, responsable_ensayo } = datos || {};
    const nombreResponsable = await getNombreEmpleado(responsable_ensayo);

    const cuerpoHtml = `
        <p>Estimados,</p>
        <p>El siguiente ensayo completó la fase de captura de datos y está listo para su revisión y aprobación:</p>
        <div class="campo"><strong>Identificador:</strong> <span class="highlight">${identificador_ensayo || 'N/A'}</span></div>
        <div class="campo"><strong>Tipo de ensayo:</strong> ${nombre_tipo_ensayo || 'N/A'}</div>
        <div class="campo"><strong>Responsable (técnico):</strong> ${nombreResponsable || 'N/A'}</div>
        <p style="margin-top: 20px;">Ingrese al sistema para revisar los resultados capturados y aprobar el ensayo.</p>
        <p>Saludos cordiales.</p>
    `;

    const html = construirHtml({
        colorAcento: '#fd7e14',
        titulo: 'Fase de ensayo culminada',
        cuerpoHtml,
    });

    await enviarSiHayCorreos(
        correos,
        `Fase de ensayo culminada - ${identificador_ensayo || ''}`.trim(),
        html,
        'Correo de culminación de fase'
    );
}

// 2.4 — Notificación de resultados de ensayos: avisa al solicitante que los
// resultados finales (aprobados) ya están disponibles.
async function enviarNotificacionResultadosEnsayo(correos, datos) {
    const { identificador_ensayo, nombre_tipo_ensayo, usuario_aprobacion, urlInforme } = datos || {};
    const nombreAprobador = await getNombreEmpleado(usuario_aprobacion);

    const cuerpoHtml = `
        <p>Estimados,</p>
        <p>Los resultados del siguiente ensayo ya se encuentran disponibles:</p>
        <div class="campo"><strong>Identificador:</strong> <span class="highlight">${identificador_ensayo || 'N/A'}</span></div>
        <div class="campo"><strong>Tipo de ensayo:</strong> ${nombre_tipo_ensayo || 'N/A'}</div>
        ${nombreAprobador ? `<div class="campo"><strong>Aprobado por:</strong> ${nombreAprobador}</div>` : ''}
        ${urlInforme ? `<p style="margin-top: 20px;"><a href="${urlInforme}">Ver informe de resultados</a></p>` : ''}
        <p style="margin-top: 20px;">Ingrese al sistema para revisar el detalle completo.</p>
        <p>Saludos cordiales.</p>
    `;

    const html = construirHtml({
        colorAcento: '#28a745',
        titulo: 'Resultados de ensayo disponibles',
        cuerpoHtml,
    });

    await enviarSiHayCorreos(
        correos,
        `Resultados de ensayo disponibles - ${identificador_ensayo || ''}`.trim(),
        html,
        'Correo de resultados de ensayo'
    );
}

// Extra — Notificación de aprobación al responsable: avisa a quien capturó los
// datos que su ensayo fue aprobado. Distinta de 2.4 (enviarNotificacionResultadosEnsayo,
// que avisa al SOLICITANTE que los resultados están disponibles) — el envío formal de
// resultados al solicitante/cliente es un correo aparte, aún no definido.
async function enviarNotificacionAprobacionEnsayo(correos, datos) {
    const { identificador_ensayo, nombre_tipo_ensayo, usuario_aprobacion } = datos || {};
    const nombreAprobador = await getNombreEmpleado(usuario_aprobacion);

    const cuerpoHtml = `
        <p>Estimado/a,</p>
        <p>El siguiente ensayo fue revisado y <strong>aprobado</strong>:</p>
        <div class="campo"><strong>Identificador:</strong> <span class="highlight">${identificador_ensayo || 'N/A'}</span></div>
        <div class="campo"><strong>Tipo de ensayo:</strong> ${nombre_tipo_ensayo || 'N/A'}</div>
        ${nombreAprobador ? `<div class="campo"><strong>Aprobado por:</strong> ${nombreAprobador}</div>` : ''}
        <p style="margin-top: 20px;">No se requiere ninguna acción adicional de tu parte.</p>
        <p>Saludos cordiales.</p>
    `;

    const html = construirHtml({
        colorAcento: '#28a745',
        titulo: 'Ensayo aprobado',
        cuerpoHtml,
    });

    await enviarSiHayCorreos(
        correos,
        `Ensayo aprobado - ${identificador_ensayo || ''}`.trim(),
        html,
        'Correo de aprobación de ensayo'
    );
}

// Extra — Notificación de rechazo: avisa al responsable que capturó los datos
// que su ensayo fue rechazado en la revisión y debe corregir/volver a notificar.
// No es una de las 4 numeradas originales, pero cierra el hueco de que nadie se
// enteraba de un rechazo (aprobarEnsayo con decision='RE').
async function enviarNotificacionRechazoEnsayo(correos, datos) {
    const { identificador_ensayo, nombre_tipo_ensayo, usuario_aprobacion, observaciones_aprobacion } = datos || {};
    const nombreAprobador = await getNombreEmpleado(usuario_aprobacion);

    const cuerpoHtml = `
        <p>Estimado/a,</p>
        <p>El siguiente ensayo fue revisado y <strong>rechazado</strong>:</p>
        <div class="campo"><strong>Identificador:</strong> <span class="highlight">${identificador_ensayo || 'N/A'}</span></div>
        <div class="campo"><strong>Tipo de ensayo:</strong> ${nombre_tipo_ensayo || 'N/A'}</div>
        ${nombreAprobador ? `<div class="campo"><strong>Rechazado por:</strong> ${nombreAprobador}</div>` : ''}
        ${observaciones_aprobacion ? `<div class="campo"><strong>Observaciones:</strong> ${observaciones_aprobacion}</div>` : ''}
        <p style="margin-top: 20px;">Ingrese al sistema para corregir los datos capturados y volver a notificar la culminación de la fase.</p>
        <p>Saludos cordiales.</p>
    `;

    const html = construirHtml({
        colorAcento: '#dc3545',
        titulo: 'Ensayo rechazado',
        cuerpoHtml,
    });

    await enviarSiHayCorreos(
        correos,
        `Ensayo rechazado - ${identificador_ensayo || ''}`.trim(),
        html,
        'Correo de rechazo de ensayo'
    );
}

const ENCUESTA_SATISFACCION_URL =
    'https://docs.google.com/forms/d/e/1FAIpQLSeC1yAwFWuM9BE2w_avtzi4wvv4Hm4pJcIuufsASK08ZrCb1w/viewform?usp=dialog';

/** Cuerpo oficial de entrega de resultados (informe PDF adjunto). */
function cuerpoEntregaResultadosHtml() {
    return `
        <p>Estimado/a,</p>
        <p>Por medio del presente, se informa que se ha finalizado el análisis de la
        muestra solicitada por su área.</p>
        <p>Los resultados obtenidos se encuentran detallados en el informe de resultados
        adjunto. Se solicita revisar la información contenida en el documento y, en caso
        de requerir alguna aclaración o información adicional relacionada con los
        resultados, metodología o condiciones del ensayo, comunicarse con el
        personal del Laboratorio de Calidad de Chaide.</p>
        <p>Agradecemos su confianza en nuestros servicios y con el objetivo de continuar
        mejorando la calidad y oportunidad de atención, le invitamos a evaluar el
        servicio recibido mediante nuestra Encuesta de Satisfacción:</p>
        <p><a href="${ENCUESTA_SATISFACCION_URL}">${ENCUESTA_SATISFACCION_URL}</a></p>
        <p>Su opinión es importante para identificar oportunidades de mejora en nuestros
        procesos y servicios.</p>
        <p>Saludos cordiales,<br/>
        Centro de Investigación del Descanso (CID)<br/>
        Chaide y Chaide S.A.</p>
    `;
}

/**
 * Entrega formal del informe de resultados al solicitante, con el PDF adjunto.
 * `cuerpoHtml` opcional: si no viene, usa el texto oficial de CID/Chaide.
 */
async function enviarInformeResultadosConAdjunto(correos, datos) {
    const {
        asunto,
        cuerpoHtml,
        pdfBuffer,
        nombreArchivo,
    } = datos || {};

    if (!pdfBuffer) {
        throw new Error('Se requiere el PDF del informe para enviarlo.');
    }

    const html = construirHtml({
        colorAcento: '#0055b8',
        titulo: 'Informe de resultados de ensayo',
        cuerpoHtml: cuerpoHtml || cuerpoEntregaResultadosHtml(),
        pieTexto: 'Centro de Investigación del Descanso (CID) — Chaide y Chaide S.A.',
    });

    await enviarSiHayCorreos(
        correos,
        (asunto && String(asunto).trim()) || 'Informe de resultados de ensayo — Laboratorio de Calidad',
        html,
        'Correo de entrega de informe de resultados',
        [
            {
                filename: nombreArchivo || 'Informe_resultados.pdf',
                content: pdfBuffer,
                contentType: 'application/pdf',
            },
        ]
    );
}

module.exports = {
    enviarNotificacionRequerimientoEntrante,
    enviarNotificacionAsignacionEnsayo,
    enviarNotificacionCulminacionFase,
    enviarNotificacionResultadosEnsayo,
    enviarNotificacionAprobacionEnsayo,
    enviarNotificacionRechazoEnsayo,
    enviarInformeResultadosConAdjunto,
};
