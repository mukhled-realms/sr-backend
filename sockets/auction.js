const auctionState = {
  item: 'تاج الأسطورة النادر 👑',
  highestBid: 340,
  highestBidder: null,
  isActive: false,
  timeLeft: 0
};

module.exports = (io, socket) => {
  socket.on('get_auction_state', () => socket.emit('auction_update', auctionState));
  socket.on('place_bid', (data) => {
    if (!auctionState.isActive) return socket.emit('auction_error', { msg: 'المزاد غير نشط' });
    if (data.amount <= auctionState.highestBid) return socket.emit('auction_error', { msg: 'مزايدة منخفضة' });
    auctionState.highestBid = data.amount;
    auctionState.highestBidder = data.bidderName;
    io.emit('auction_update', auctionState);
  });
};
