document.addEventListener('DOMContentLoaded', function() {
    const btnCalc30Dias = document.getElementById('btn-calc-30dias');
    const resultadoContainer = document.getElementById('resultado-container');
    const totalIngresosSpan = document.getElementById('total-ingresos');
    const tablaDetallesBody = document.getElementById('tabla-detalles');

    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const trabajosFinalizados = JSON.parse(localStorage.getItem('trabajosFinalizados')) || [];

    btnCalc30Dias.addEventListener('click', () => {
        // 1. Definir el rango de fechas (últimos 30 días)
        const hoy = new Date();
        const hace30Dias = new Date();
        hace30Dias.setDate(hoy.getDate() - 30);

        // 2. Filtrar los trabajos que están dentro de ese rango
        const trabajosEnRango = trabajosFinalizados.filter(trabajo => {
            if (!trabajo.fechaFinalizacion) return false;
            
            // Convertimos la fecha de "DD/MM/YYYY" a un objeto Date para poder comparar
            const parts = trabajo.fechaFinalizacion.split('/');
            const fechaTrabajo = new Date(parts[2], parts[1] - 1, parts[0]);
            
            return fechaTrabajo >= hace30Dias && fechaTrabajo <= hoy;
        });

        // 3. Calcular el total sumando los montos
        const total = trabajosEnRango.reduce((sum, trabajo) => sum + trabajo.total, 0);

        // 4. Mostrar el total en la página
        totalIngresosSpan.textContent = total.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

        // 5. Llenar la tabla con los detalles de los trabajos
        tablaDetallesBody.innerHTML = ''; // Limpiar tabla anterior
        if (trabajosEnRango.length > 0) {
            trabajosEnRango.forEach(trabajo => {
                const cliente = clientes[trabajo.clienteIndex];
                if (!cliente) return;

                const fila = `
                    <tr>
                        <td>${trabajo.fechaFinalizacion}</td>
                        <td>${cliente.nombre}</td>
                        <td>${cliente.marca} ${cliente.modelo}</td>
                        <td>${trabajo.total.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</td>
                    </tr>
                `;
                tablaDetallesBody.innerHTML += fila;
            });
        } else {
            tablaDetallesBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No se encontraron trabajos finalizados en los últimos 30 días.</td></tr>';
        }

        // 6. Hacer visible el contenedor de resultados
        resultadoContainer.classList.remove('hidden');
    });
});