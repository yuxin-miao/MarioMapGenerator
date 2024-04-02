
var modal = document.getElementById("myModal");
function openModal() {
    modal.style.display = "block";
}
function closeModal() {
    modal.style.display = "none";
}
// Get the form element
var form = document.getElementById("questionnaireForm");

// Bind the closeModal function to the form's submit event
form.onsubmit = function (event) {
    event.preventDefault(); // Prevent actual form submission to server
    closeModal(); // Close the modal when the form is submitted
    FSM.GamesRunner.play();
    // Here you can also add your form submission logic or AJAX request

};

