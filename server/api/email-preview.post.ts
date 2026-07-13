import { buildAdminTemplate, buildConfirmationTemplate } from '../utils/emailTemplate'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { template = 'admin', customMessageHtml = '', type = 'distributor' } = body

  if (template === 'admin') {
    const html = buildAdminTemplate({
      type,
      fields: {
        'Nombre del negocio':   'Distribuidora Ejemplo S.A.',
        'Nombre del contacto':  'María García',
        'Dirección':            '123 SW 8th St, Miami, FL 33130',
        'Estado':               'Florida',
        'Teléfono':             '+1 (305) 555-0192',
        'Email':                'maria@distribuidora.com',
        'Productos de interés': 'Crema ácida, Jugos, Malteadas',
      },
      customMessageHtml: customMessageHtml || undefined,
    })
    return { html }
  }

  if (template === 'confirmation') {
    const html = buildConfirmationTemplate(type, 'María García', customMessageHtml || undefined)
    return { html }
  }

  return { html: '<p>Tipo de plantilla desconocido</p>' }
})
