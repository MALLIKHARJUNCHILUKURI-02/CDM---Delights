document.addEventListener("DOMContentLoaded", function () {
    const menuIcon = document.querySelector(".menu_icon");
    const navList = document.querySelector("#listitems");

    menuIcon.addEventListener("click", function () {
        navList.classList.toggle("active");
    });
});
