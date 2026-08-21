// index page behavior: navigate to test page when a card Start is clicked
document.addEventListener('DOMContentLoaded', () => {
  const cardButtons = document.querySelectorAll('.card-start');
  cardButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const m = Number(btn.dataset.min) || 1;
      window.location.href = `test.html?d=${m}`;
    });
  });
});