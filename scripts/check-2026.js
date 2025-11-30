const data = require('../src/data/cars.json');

const cars2026 = data.cars.filter(c => c.year === 2026);

console.log('2026 cars without ratings:');
cars2026.filter(c => !c.safetyRating || c.safetyRating === 'Not Rated').forEach(c => {
  console.log('  ' + c.make + ' ' + c.model);
});

console.log('\n2026 cars WITH ratings:');
cars2026.filter(c => c.safetyRating && c.safetyRating !== 'Not Rated').forEach(c => {
  console.log('  ' + c.make + ' ' + c.model + ': ' + c.safetyRating);
});

// Check if 2025 versions exist with ratings
console.log('\n\nChecking for 2025 versions with ratings:');
const unrated2026 = cars2026.filter(c => !c.safetyRating || c.safetyRating === 'Not Rated');
unrated2026.forEach(car2026 => {
  const car2025 = data.cars.find(c =>
    c.year === 2025 &&
    c.make === car2026.make &&
    c.model === car2026.model
  );
  if (car2025 && car2025.safetyRating && car2025.safetyRating !== 'Not Rated') {
    console.log('  ' + car2026.make + ' ' + car2026.model + ' -> can use 2025 rating: ' + car2025.safetyRating);
  } else if (car2025) {
    console.log('  ' + car2026.make + ' ' + car2026.model + ' -> 2025 exists but no rating');
  } else {
    console.log('  ' + car2026.make + ' ' + car2026.model + ' -> no 2025 version found');
  }
});
