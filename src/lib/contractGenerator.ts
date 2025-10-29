import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, convertInchesToTwip, BorderStyle } from 'docx';

interface WorkerData {
  nombre: string;
  rut: string;
  nacionalidad?: string;
  estado_civil?: string;
  direccion?: string;
  ciudad?: string;
  cargo?: string;
  fecha_inicio?: string;
  tipo_plazo: string;
  fecha_termino?: string;
  tipo_jornada: string;
  sucursal_admin?: string;
  funciones?: string;
  horario_laboral?: string;
  turnos_rotativos?: boolean;
  clausulas_especiales?: string;
  afp?: string;
  salud?: string;
  banco?: string;
  tipo_cuenta?: string;
  numero_cuenta?: string;
}

interface ClientData {
  razon_social: string;
  rut: string;
  direccion?: string;
  ciudad?: string;
  representante_legal?: string;
  rut_representante?: string;
}

export function generateContractDocument(worker: WorkerData, client: ClientData): Document {
  const today = new Date().toLocaleDateString('es-CL');
  
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
          },
        },
      },
      children: [
        // Título
        new Paragraph({
          text: "CONTRATO DE TRABAJO",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // Fecha y lugar
        new Paragraph({
          children: [
            new TextRun({
              text: `En ${client.ciudad || '___________'}, a ${today}`,
              italics: true,
            }),
          ],
          spacing: { after: 200 },
        }),

        // Entre comparecen
        new Paragraph({
          children: [
            new TextRun({
              text: "ENTRE:",
              bold: true,
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        // Datos del empleador
        new Paragraph({
          children: [
            new TextRun({
              text: `${client.razon_social}`,
              bold: true,
            }),
            new TextRun({
              text: `, RUT ${client.rut}, representada legalmente por `,
            }),
            new TextRun({
              text: `${client.representante_legal || '___________'}`,
              bold: true,
            }),
            new TextRun({
              text: `, RUT ${client.rut_representante || '___________'}, con domicilio en ${client.direccion || '___________'}, ${client.ciudad || '___________'}, en adelante "EL EMPLEADOR",`,
            }),
          ],
          spacing: { after: 200 },
        }),

        // Y el trabajador
        new Paragraph({
          text: "Y",
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `${worker.nombre}`,
              bold: true,
            }),
            new TextRun({
              text: `, ${worker.nacionalidad || 'chileno(a)'}, ${worker.estado_civil || '___________'}, RUT ${worker.rut}, domiciliado(a) en ${worker.direccion || '___________'}, ${worker.ciudad || '___________'}, en adelante "EL TRABAJADOR",`,
            }),
          ],
          spacing: { after: 200 },
        }),

        // Se ha convenido
        new Paragraph({
          text: "Se ha convenido el siguiente contrato de trabajo:",
          spacing: { before: 400, after: 200 },
        }),

        // PRIMERO: Naturaleza del servicio
        new Paragraph({
          children: [
            new TextRun({
              text: "PRIMERO: ",
              bold: true,
            }),
            new TextRun({
              text: `EL TRABAJADOR se compromete a desempeñar el cargo de `,
            }),
            new TextRun({
              text: `${worker.cargo || '___________'}`,
              bold: true,
            }),
            worker.sucursal_admin ? new TextRun({
              text: `, en la sucursal de ${worker.sucursal_admin}`,
            }) : new TextRun({ text: '' }),
            new TextRun({
              text: `.`,
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        // Funciones si existen
        ...(worker.funciones ? [
          new Paragraph({
            children: [
              new TextRun({
                text: "Funciones principales:",
                bold: true,
              }),
            ],
            spacing: { before: 100, after: 100 },
          }),
          new Paragraph({
            text: worker.funciones,
            spacing: { after: 200 },
          }),
        ] : []),

        // SEGUNDO: Fecha de inicio
        new Paragraph({
          children: [
            new TextRun({
              text: "SEGUNDO: ",
              bold: true,
            }),
            new TextRun({
              text: `EL TRABAJADOR prestará sus servicios a partir del ${worker.fecha_inicio || '___________'}`,
            }),
            worker.tipo_plazo === 'fijo' && worker.fecha_termino ? new TextRun({
              text: ` y hasta el ${worker.fecha_termino}, siendo un contrato a plazo fijo`,
            }) : new TextRun({
              text: ', siendo un contrato a plazo indefinido',
            }),
            new TextRun({
              text: '.',
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        // TERCERO: Jornada de trabajo
        new Paragraph({
          children: [
            new TextRun({
              text: "TERCERO: ",
              bold: true,
            }),
            new TextRun({
              text: `La jornada de trabajo será de tipo `,
            }),
            new TextRun({
              text: worker.tipo_jornada === 'completa' ? 'COMPLETA' : 
                    worker.tipo_jornada === 'parcial_30' ? 'PARCIAL de 30 horas semanales' :
                    worker.tipo_jornada === 'parcial_20' ? 'PARCIAL de 20 horas semanales' : '___________',
              bold: true,
            }),
            new TextRun({
              text: '.',
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        // Horario si existe
        ...(worker.horario_laboral ? [
          new Paragraph({
            children: [
              new TextRun({
                text: "Horario de trabajo:",
                bold: true,
              }),
            ],
            spacing: { before: 100, after: 100 },
          }),
          new Paragraph({
            text: worker.horario_laboral,
            spacing: { after: 200 },
          }),
        ] : []),

        // Turnos rotativos si aplica
        ...(worker.turnos_rotativos ? [
          new Paragraph({
            children: [
              new TextRun({
                text: "El trabajador estará sujeto a ",
              }),
              new TextRun({
                text: "TURNOS ROTATIVOS",
                bold: true,
              }),
              new TextRun({
                text: " según las necesidades operativas de la empresa.",
              }),
            ],
            spacing: { after: 200 },
          }),
        ] : []),

        // CUARTO: Remuneración
        new Paragraph({
          children: [
            new TextRun({
              text: "CUARTO: ",
              bold: true,
            }),
            new TextRun({
              text: "Por los servicios convenidos, EL EMPLEADOR pagará a EL TRABAJADOR una remuneración mensual de $__________, pagadera mensualmente los últimos días de cada mes.",
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        // QUINTO: Previsión
        new Paragraph({
          children: [
            new TextRun({
              text: "QUINTO: ",
              bold: true,
            }),
            new TextRun({
              text: `EL TRABAJADOR se encuentra afiliado a ${worker.afp || '___________'} para efectos de pensiones y a ${worker.salud || '___________'} para efectos de salud.`,
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        // SEXTO: Datos bancarios
        new Paragraph({
          children: [
            new TextRun({
              text: "SEXTO: ",
              bold: true,
            }),
            new TextRun({
              text: `EL TRABAJADOR declara mantener cuenta bancaria en ${worker.banco || '___________'}, tipo ${worker.tipo_cuenta || '___________'}, N° ${worker.numero_cuenta || '___________'}, para efectos del pago de su remuneración.`,
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        // SÉPTIMO: Obligaciones generales
        new Paragraph({
          children: [
            new TextRun({
              text: "SÉPTIMO: ",
              bold: true,
            }),
            new TextRun({
              text: "EL TRABAJADOR se obliga a cumplir fielmente las instrucciones de EL EMPLEADOR, el reglamento interno de la empresa, y las normas legales vigentes.",
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        // Cláusulas especiales si existen
        ...(worker.clausulas_especiales ? [
          new Paragraph({
            children: [
              new TextRun({
                text: "CLÁUSULAS ESPECIALES:",
                bold: true,
              }),
            ],
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: worker.clausulas_especiales,
            spacing: { after: 200 },
          }),
        ] : []),

        // Domicilio y jurisdicción
        new Paragraph({
          children: [
            new TextRun({
              text: "OCTAVO: ",
              bold: true,
            }),
            new TextRun({
              text: `Para todos los efectos legales del presente contrato, las partes fijan domicilio en la ciudad de ${client.ciudad || '___________'} y se someten a la jurisdicción de sus tribunales.`,
            }),
          ],
          spacing: { before: 400, after: 400 },
        }),

        // Firmas
        new Paragraph({
          text: "",
          spacing: { before: 800 },
        }),

        new Paragraph({
          text: "___________________________                    ___________________________",
          spacing: { before: 400, after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "        EL EMPLEADOR",
            }),
            new TextRun({
              text: "                                        EL TRABAJADOR",
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `    ${client.representante_legal || '___________'}`,
            }),
            new TextRun({
              text: `                                   ${worker.nombre}`,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `    RUT: ${client.rut_representante || '___________'}`,
            }),
            new TextRun({
              text: `                              RUT: ${worker.rut}`,
            }),
          ],
        }),
      ],
    }],
  });

  return doc;
}
