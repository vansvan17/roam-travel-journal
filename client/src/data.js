export const covers = {
  bali: { image: 'photo-1537996194471-e657df975ab4', label: 'Bali', color: '#668b65' },
  japan: { image: 'photo-1493976040374-85c8e12f0c0e', label: 'Japan', color: '#cb8e90' },
  italy: { image: 'photo-1516483638261-f4dbaf036963', label: 'Italy', color: '#bd8461' },
  mountains: { image: 'photo-1464822759023-fed622ff2c3b', label: 'Mountains', color: '#76928d' },
  coast: { image: 'photo-1519046904884-53103b34b206', label: 'Coast', color: '#7baab0' },
  city: { image: 'photo-1480714378408-67cf0d13bc1b', label: 'City', color: '#9d9690' }
};
export const photo = (cover, width = 1000) => `https://images.unsplash.com/${covers[cover]?.image || covers.bali.image}?auto=format&fit=crop&w=${width}&q=85`;
export const uid = () => crypto.randomUUID();
export const today = () => new Date().toLocaleDateString('en-CA');
export const dateLabel = (date, options = {}) => new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...options });
export const duration = trip => Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000) + 1;
export const money = (value, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
export const spent = trip => trip.expenses.reduce((sum, e) => sum + e.amount, 0);
export function sampleTrips() {
  return [
    { id: uid(), title: 'A slower kind of Bali', destination: 'Ubud & Canggu', country: 'Indonesia', startDate: '2026-11-14', endDate: '2026-11-21', status: 'Upcoming', budget: 65000, currency: 'INR', cover: 'bali', notes: 'Early mornings, rice terraces, and absolutely no rushing. Leave room for the unexpected.',
      itinerary: [{ id: uid(), day: 1, time: '10:00', title: 'Touch down in Denpasar', notes: 'Airport transfer to Ubud. Check in and take it slow.' },{ id: uid(), day: 2, time: '06:30', title: 'Sunrise at Tegallalang', notes: 'Bring a camera and comfortable shoes.' },{ id: uid(), day: 2, time: '14:00', title: 'A little café hopping', notes: 'Coffee, a good book, and nowhere to be.' }],
      expenses: [{ id: uid(), title: 'Ubud guesthouse · 4 nights', amount: 14000, category: 'Stay', date: '2026-11-14' },{ id: uid(), title: 'Return flights', amount: 22000, category: 'Transport', date: '2026-11-14' }], entries: [] },
    { id: uid(), title: 'Lost in Kyoto', destination: 'Kyoto & Osaka', country: 'Japan', startDate: '2027-03-24', endDate: '2027-04-02', status: 'Upcoming', budget: 150000, currency: 'INR', cover: 'japan', notes: 'Following the cherry blossoms. A spring escape with plenty of ramen stops.', itinerary: [{ id: uid(), day: 1, time: '16:00', title: 'Wander through Gion', notes: 'Find a quiet side street for dinner.' }], expenses: [], entries: [] },
    { id: uid(), title: 'Postcards from the coast', destination: 'Cinque Terre', country: 'Italy', startDate: '2026-08-05', endDate: '2026-08-11', status: 'Completed', budget: 95000, currency: 'INR', cover: 'italy', notes: 'Five villages, a thousand shades of blue.', itinerary: [], expenses: [{ id: uid(), title: 'Village guesthouse', amount: 34000, category: 'Stay', date: '2026-08-05' },{ id: uid(), title: 'Pasta, pesto & gelato', amount: 8500, category: 'Food', date: '2026-08-06' },{ id: uid(), title: 'Flights & train passes', amount: 38000, category: 'Transport', date: '2026-08-05' }], entries: [{ id: uid(), title: 'The long way is the right way', body: 'We missed the train and walked to the next village instead. Somewhere between the lemon trees and the sea, I stopped checking the time. That was the best part of the whole trip.', date: '2026-08-07', mood: 'Grateful' }] }
  ];
}
export const tripPayload = trip => Object.fromEntries(['planStatus','title','destination','country','startDate','endDate','status','budget','currency','cover','notes','expenses','itinerary','entries'].map(k => [k, trip[k]]));
export async function request(path, options = {}) {
  let res;
  try { res = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers }, credentials: 'same-origin' }); }
  catch { throw new Error('You seem to be offline. Check your connection and try again.'); }
  let data;
  try { data = await res.json(); } catch { throw new Error('The server is unavailable. Please try again shortly.'); }
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}
