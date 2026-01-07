import { lessons } from "../model/content.js";

let index = 0;

export function renderLesson() {
  const contentDiv = document.getElementById("lessonContent");
  const lesson = lessons[index];

  contentDiv.innerHTML = `
    <h4>${lesson.title}</h4>
    <p>${lesson.body}</p>
  `;
}

export function nextLesson() {
  index = (index + 1) % lessons.length;
  renderLesson();
}
