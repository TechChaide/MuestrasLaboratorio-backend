const { enviarInformeResultadosConAdjunto } = require('../mailer/mailer');

/** POST /api/informes/enviar-resultados
 * Body: { correos, asunto?, cuerpoHtml?, pdfBase64, nombreArchivo? }
 * Envía el correo de entrega de resultados con el PDF del informe adjunto.
 */
async function enviarResultados(req, res) {
  try {
    const { correos, asunto, cuerpoHtml, pdfBase64, nombreArchivo } = req.body || {};
    if (!correos || typeof correos !== 'string' || !correos.trim()) {
      return res.status(400).json({ message: 'Indica al menos un correo destinatario.' });
    }
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return res.status(400).json({ message: 'Falta el PDF del informe (pdfBase64).' });
    }

    const base64 = pdfBase64.includes(',') ? pdfBase64.split(',').pop() : pdfBase64;
    const buffer = Buffer.from(base64, 'base64');
    if (!buffer.length) {
      return res.status(400).json({ message: 'El PDF adjunto está vacío o es inválido.' });
    }
    // Límite práctico ~12MB en base64 (~9MB binario) para no saturar el relay.
    if (buffer.length > 9 * 1024 * 1024) {
      return res.status(413).json({ message: 'El PDF supera el tamaño máximo permitido (9MB).' });
    }

    await enviarInformeResultadosConAdjunto(correos, {
      asunto,
      cuerpoHtml,
      pdfBuffer: buffer,
      nombreArchivo: nombreArchivo || 'Informe_resultados.pdf',
    });

    return res.status(200).json({ message: 'Informe enviado correctamente.' });
  } catch (error) {
    console.error('Error al enviar informe de resultados:', error);
    return res.status(500).json({
      message: error.message || 'No se pudo enviar el informe por correo.',
    });
  }
}

module.exports = { enviarResultados };
