import { useState } from 'react'
import './App.css'
// import TableMod from './components/Table'
import { Button } from './components/ui/button'

import formStructure from '@/mocks/formStructure.json'
import { Seccion } from './types/seccion'
import Treednd from '@/components/Treednd'

function App() {
  const [jsonFormStructure] = useState(formStructure)

  const secciones: Seccion[] = jsonFormStructure
  // const seccionesSinPreguntas: SeccionSinPreguntas[] = jsonFormStructure
  const preguntasPorSeccion = secciones.flatMap(seccion =>
    seccion.preguntas.map(pregunta =>
    ({
      ...pregunta,
      entidad: seccion.entidad
    }))
  )

  // const fields = preguntasPorSeccion.map(x =>
  //   ({ orden: x.orden, label: x.label, tipo: x.tipo, core: x.core, entidad: x.entidad })
  // )

  console.log(preguntasPorSeccion)

  return (
    <>
      <div className='grid grid-cols-5 '>
        <div>
          <div className='col-span-1 grid grid-col gap-3'>
            <h1>Componetes</h1>
            <Button>Texto</Button>
            <Button>Numerico</Button>
            <Button>Seleccion</Button>
            <Button>Seleccion dependiente</Button>
            <Button>Compuesta</Button>
            <Button>Fecha</Button>
            <Button>Check</Button>
            <Button>Texto largo</Button>
          </div>
        </div>
        <div className='col-span-4'>
          <h1>Estructura del formulario</h1>
          <div>
            <Treednd secciones={jsonFormStructure} />
          </div>
        </div>
      </div>

      {/* <div className='mx-30'>
        <h1>Secciones</h1>
        <TableMod data={seccionesSinPreguntas} />
      </div>
      <br />
      <div className='mx-30'>
        <h1>Preguntas</h1>
        <TableMod data={fields} />
      </div> */}
    </>
  )
}

export default App
