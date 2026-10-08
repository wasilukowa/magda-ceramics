// Ile prac jest w zamówieniu — od tego zależy „praca czeka" czy „prace
// czekają" w mailach i na stronie zamówienia.
export const countPieces = (items: { quantity: number }[]): number =>
  items.reduce((sum, item) => sum + item.quantity, 0);
