(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/students/class/10');
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log(text);
  } catch (err) {
    console.error('ERR', err.message);
  }
})();
