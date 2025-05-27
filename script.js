const firebaseConfig = {
  apiKey: "AIzaSyAySrOuWY7Zr7Etq_iFKSFLiWsng3KTkXA",
  authDomain: "edc-automotriz.firebaseapp.com",
  projectId: "edc-automotriz",
  storageBucket: "edc-automotriz.firebasestorage.app",
  messagingSenderId: "387959087823",
  appId: "1:387959087823:web:03469bf7d12f4e78674dba",
  measurementId: "G-K98Q6XWTFT"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

document.addEventListener('DOMContentLoaded', function() {
  const btnAbrirPanelLogin = document.getElementById('btn-abrir-modal-login');
  const panelLogin = document.getElementById('panel-login');
  const btnCerrarPanelLogin = document.getElementById('btn-cerrar-panel-login');
  const btnLogin = document.getElementById('btn-login');
  const btnRegister = document.getElementById('btn-register');

  // --- INICIO DE PRUEBAS (MODIFICACIÓN) ---
  console.log("Botón para abrir panel:", btnAbrirPanelLogin);
  console.log("Panel de Login:", panelLogin);
  // --- FIN DE PRUEBAS ---

  if (btnAbrirPanelLogin) {
    btnAbrirPanelLogin.addEventListener('click', () => {
      console.log("¡Clic detectado en btnAbrirPanelLogin!"); // Para ver si el evento se dispara (MODIFICACIÓN)
      if (panelLogin) {
        panelLogin.style.display = 'block';
        window.scrollTo({ top: panelLogin.offsetTop - 20, behavior: 'smooth' });
      } else {
        console.error("Error: panelLogin no fue encontrado al hacer clic."); // (MODIFICACIÓN)
      }
    });
  } else {
    console.error("Error: btnAbrirPanelLogin no fue encontrado en el DOM."); // (MODIFICACIÓN)
  }

  if (btnCerrarPanelLogin) {
    btnCerrarPanelLogin.addEventListener('click', () => {
      if (panelLogin) { // (MODIFICACIÓN: Añadir verificación por si acaso)
        panelLogin.style.display = 'none';
      } else {
        console.error("Error: panelLogin no fue encontrado al intentar cerrar.");
      }
    });
  }

  if (btnLogin) { // (MODIFICACIÓN: Añadir verificación por consistencia)
    btnLogin.addEventListener('click', () => {
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      if (!email || !password) {
        alert("Completa ambos campos.");
        return;
      }
      auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          alert("¡Inicio de sesión exitoso!");
          if (panelLogin) panelLogin.style.display = 'none';
          mostrarBotonAdminSiAutenticado();
        })
        .catch((error) => {
          alert("Error al iniciar sesión: " + error.message);
        });
    });
  }


  if (btnRegister) { // (MODIFICACIÓN: Añadir verificación por consistencia)
    btnRegister.addEventListener('click', () => {
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      if (!email || !password) {
        alert("Completa ambos campos.");
        return;
      }
      auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          alert("¡Cuenta creada! Ahora inicia sesión.");
        })
        .catch((error) => {
          alert("Error al registrar: " + error.message);
        });
    });
  }


  function mostrarBotonAdminSiAutenticado() {
    auth.onAuthStateChanged(function(user) {
      const btnPanelAdmin = document.querySelector('.btn-admin[href="admin.html"]');
      if (btnPanelAdmin) { // (MODIFICACIÓN: Añadir verificación)
        if (user) {
          btnPanelAdmin.style.display = 'inline-block';
        } else {
          btnPanelAdmin.style.display = 'none';
        }
      } else {
        console.error("Botón Panel Admin no encontrado para mostrar/ocultar.");
      }
    });
  }
  mostrarBotonAdminSiAutenticado(); // Llamada inicial
});


// ----------------------
// Lógica para presupuestos guardados (esta parte pertenece a admin.html o una página similar, no a index.html)
// Si esta lógica es para admin.html, es mejor mantenerla allí o en un script específico para admin.
// Por ahora, la dejaré aquí comentada si es que necesitas moverla o si script.js es usado también por admin.html directamente para esto.
// Si es así, asegúrate de que los elementos como 'lista-presupuestos' existan en la página donde se ejecuta.
// ----------------------
/*
document.addEventListener('DOMContentLoaded', () => {
  const listaPresupuestos = document.getElementById('lista-presupuestos');
  if (!listaPresupuestos) {
    // console.log("Elemento 'lista-presupuestos' no encontrado, omitiendo lógica de presupuestos guardados.");
    return; // Para evitar errores en otras páginas como index.html
  }

  db.collection("presupuestos").orderBy("creadoEl", "desc").onSnapshot(snapshot => {
    listaPresupuestos.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement('div');
      div.style.border = "1px solid #ad0000";
      div.style.margin = "10px";
      div.style.padding = "10px";
      div.innerHTML = `
        <p><strong>Vehículo:</strong> ${data.vehiculoId}</p>
        <p><strong>Total:</strong> $${data.total}</p>
        <ul>${data.items.map(item => `<li>${item.repuesto}: $${item.monto} (<a href="${item.link}" target="_blank">Ver</a>)</li>`).join('')}</ul>
        <button class="aceptar-btn">Aceptar</button>
        <button class="rechazar-btn">Rechazar</button>
        <button class="pdf-btn">Generar PDF</button>
        <button class="whatsapp-btn">Enviar por WhatsApp</button>
      `;
      listaPresupuestos.appendChild(div);

      div.querySelector('.aceptar-btn').addEventListener('click', () => aceptarPresupuesto(doc.id, data));
      div.querySelector('.rechazar-btn').addEventListener('click', () => rechazarPresupuesto(doc.id));
      div.querySelector('.pdf-btn').addEventListener('click', () => generarPDF(data));
      div.querySelector('.whatsapp-btn').addEventListener('click', () => enviarWhatsApp(data));
    });
  }, error => { // (MODIFICACIÓN: Añadir manejo de error para onSnapshot)
    console.error("Error al obtener presupuestos en tiempo real:", error);
    listaPresupuestos.innerHTML = "<p>Error al cargar los presupuestos. Intenta más tarde.</p>";
  });

  function aceptarPresupuesto(id, data) {
    db.collection("trabajos").add(data).then(() => {
      return db.collection("presupuestos").doc(id).delete();
    }).then(() => {
      alert("Presupuesto aceptado y movido a trabajos.");
    }).catch(err => {
      console.error("Error al aceptar presupuesto:", err);
      alert("Error al aceptar el presupuesto.");
    });
  }

  function rechazarPresupuesto(id) {
    db.collection("presupuestos").doc(id).delete().then(() => {
      alert("Presupuesto eliminado.");
    }).catch(err => {
      console.error("Error al rechazar presupuesto:", err);
      alert("Error al eliminar el presupuesto.");
    });
  }

  function generarPDF(data) {
    // Asegúrate que jsPDF esté cargado en la página donde esto se usa
    if (typeof jsPDF === 'undefined') {
      console.error("jsPDF no está definido. Asegúrate de que la librería esté cargada.");
      alert("Error al generar PDF: librería no encontrada.");
      return;
    }
    const { jsPDF: JSPDF } = window.jspdf; // Correcta destructuración si es necesario
    const doc = new JSPDF();
    doc.text("Presupuesto del Taller", 10, 10);
    doc.text("Vehículo ID: " + data.vehiculoId, 10, 20);
    let y = 30;
    data.items.forEach(item => {
      doc.text(`${item.repuesto}: $${item.monto} - ${item.link || 'N/A'}`, 10, y); // (MODIFICACIÓN: Manejar link undefined)
      y += 10;
    });
    doc.text("Total: $" + data.total, 10, y + 10);
    doc.save("presupuesto.pdf");
  }

  function enviarWhatsApp(data) {
    const mensaje = encodeURIComponent("Hola! Aquí te envío el presupuesto del vehículo: " + data.vehiculoId + " por $" + data.total);
    const link = `https://wa.me/?text=${mensaje}`;
    window.open(link, '_blank');
  }
});
*/