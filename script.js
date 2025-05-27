
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

  if (btnAbrirPanelLogin) {
    btnAbrirPanelLogin.addEventListener('click', () => {
      panelLogin.style.display = 'block';
      window.scrollTo({ top: panelLogin.offsetTop - 20, behavior: 'smooth' });
    });
  }

  if (btnCerrarPanelLogin) {
    btnCerrarPanelLogin.addEventListener('click', () => {
      panelLogin.style.display = 'none';
    });
  }

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
        panelLogin.style.display = 'none';
        mostrarBotonAdminSiAutenticado();
      })
      .catch((error) => {
        alert("Error al iniciar sesión: " + error.message);
      });
  });

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

  function mostrarBotonAdminSiAutenticado() {
    auth.onAuthStateChanged(function(user) {
      const btnPanelAdmin = document.querySelector('.btn-admin[href="admin.html"]');
      if (user) {
        btnPanelAdmin.style.display = 'inline-block';
      } else {
        btnPanelAdmin.style.display = 'none';
      }
    });
  }
  mostrarBotonAdminSiAutenticado();
});


// ----------------------
// Lógica para presupuestos guardados
// ----------------------
document.addEventListener('DOMContentLoaded', () => {
  const listaPresupuestos = document.getElementById('lista-presupuestos');
  if (!listaPresupuestos) return; // Para evitar errores en otras páginas

  db.collection("presupuestos").orderBy("creadoEl", "desc").onSnapshot(snapshot => {
    listaPresupuestos.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement('div');
      div.style.border = "1px solid #ad0000";
      div.style.margin = "10px";
      div.style.padding = "10px";
      div.innerHTML = \`
        <p><strong>Vehículo:</strong> \${data.vehiculoId}</p>
        <p><strong>Total:</strong> $\${data.total}</p>
        <ul>\${data.items.map(item => \`<li>\${item.repuesto}: $\${item.monto} (<a href="\${item.link}" target="_blank">Ver</a>)</li>\`).join('')}</ul>
        <button class="aceptar-btn">Aceptar</button>
        <button class="rechazar-btn">Rechazar</button>
        <button class="pdf-btn">Generar PDF</button>
        <button class="whatsapp-btn">Enviar por WhatsApp</button>
      \`;
      listaPresupuestos.appendChild(div);

      div.querySelector('.aceptar-btn').addEventListener('click', () => aceptarPresupuesto(doc.id, data));
      div.querySelector('.rechazar-btn').addEventListener('click', () => rechazarPresupuesto(doc.id));
      div.querySelector('.pdf-btn').addEventListener('click', () => generarPDF(data));
      div.querySelector('.whatsapp-btn').addEventListener('click', () => enviarWhatsApp(data));
    });
  });

  function aceptarPresupuesto(id, data) {
    db.collection("trabajos").add(data).then(() => {
      return db.collection("presupuestos").doc(id).delete();
    }).then(() => {
      alert("Presupuesto aceptado y movido a trabajos.");
    }).catch(err => console.error(err));
  }

  function rechazarPresupuesto(id) {
    db.collection("presupuestos").doc(id).delete().then(() => {
      alert("Presupuesto eliminado.");
    }).catch(err => console.error(err));
  }

  function generarPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Presupuesto del Taller", 10, 10);
    doc.text("Vehículo ID: " + data.vehiculoId, 10, 20);
    let y = 30;
    data.items.forEach(item => {
      doc.text(\`\${item.repuesto}: $\${item.monto} - \${item.link}\`, 10, y);
      y += 10;
    });
    doc.text("Total: $" + data.total, 10, y + 10);
    doc.save("presupuesto.pdf");
  }

  function enviarWhatsApp(data) {
    const mensaje = encodeURIComponent("Hola! Aquí te envío el presupuesto del vehículo: " + data.vehiculoId + " por $" + data.total);
    const link = \`https://wa.me/?text=\${mensaje}\`;
    window.open(link, '_blank');
  }
});
