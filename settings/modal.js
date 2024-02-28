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
    }
}
// document.addEventListener('DOMContentLoaded', (event) => {
//     // Add scale questions
//     addScaleQuestion('paceLevel', 'Pace of the Level: How satisfied were you with the pace of the level?', 'scaleQuestionsContainer', 'Too slow', 'Too fast');
//     addScaleQuestion('contentDifficulty', 'Content Difficulty: How do you rate the difficulty of the content?', 'scaleQuestionsContainer', 'Too easy', 'Too difficult');
//     // Add more questions as needed
// });
// function addScaleQuestion(questionId, questionText, containerId, text1, text2) {
//     // Construct the HTML for the scale question
//     let html = `<label for="${questionId}">${questionText}</label><br>`;
//     for (let i = 1; i <= 5; i++) {
//         let label = (i === 1) ? '1 (Too slow)' : (i === 5) ? '5 (Too fast)' : i; // Customize labels if needed
//         html += `<label><input type="radio" id="${questionId}${i}" name="${questionId}" value="${i}"> ${label}</label><br>`;
//     }

//     // Append the HTML to the specified container
//     document.getElementById(containerId).innerHTML += html + '<br>';
// }
