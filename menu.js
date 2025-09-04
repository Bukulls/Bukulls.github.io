document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menu-btn');
    const sideNav = document.getElementById('side-nav');

    if (menuBtn && sideNav) {
        menuBtn.addEventListener('click', function() {
            // Alterna las clases para mostrar/ocultar el menú
            // y animar el botón
            menuBtn.classList.toggle('active');
            sideNav.classList.toggle('open');
        });
    }
});