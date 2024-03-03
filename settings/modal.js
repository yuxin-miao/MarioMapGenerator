var modal = document.getElementById("myModal");
function openModal() {
    modal.style.display = "block";
}
function closeModal() {
    modal.style.display = "none";
}
var span = document.getElementsByClassName("close")[0];
span.onclick = function () {
    closeModal();
}
window.onclick = function (event) {
    if (event.target == modal) {
        closeModal();
        FSM.GamesRunner.play();
    }
}

