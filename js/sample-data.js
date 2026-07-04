/* Sample hotels shown in Demo Mode (before the database is connected).
   Once Supabase is connected, hotels come from the database instead. */

const SAMPLE_HOTELS = [
  {
    id: "demo-1",
    name: "Masseria Le Torri",
    stars: 5,
    distance_km: 2.1,
    travel_minutes: 6,
    price_from: 240,
    amenities: ["wifi", "pool", "breakfast", "parking", "spa", "restaurant"],
    photos: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200&q=80"
    ],
    address: "SP240, Conversano BA, Italy",
    lat: 40.9412, lng: 17.2033,
    phone: "+39 080 000 0001",
    email: "info@masserialetorri.example",
    description_en: "A restored 17th century farmhouse among centuries-old olive trees, five minutes from the venue. Vaulted limestone rooms, a quiet pool and one of the best breakfasts in the valley.",
    description_pt: "Uma fazenda do século XVII restaurada entre oliveiras centenárias, a cinco minutos do local do casamento. Quartos de pedra calcária, piscina tranquila e um dos melhores cafés da manhã da região.",
    description_it: "Una masseria del Seicento restaurata tra ulivi secolari, a cinque minuti dalla location. Camere in pietra con volte a stella, piscina tranquilla e una delle migliori colazioni della valle.",
    cancellation_en: "Free cancellation up to 30 days before arrival. After that, one night is charged.",
    cancellation_pt: "Cancelamento gratuito até 30 dias antes da chegada. Depois disso, é cobrada uma diária.",
    cancellation_it: "Cancellazione gratuita fino a 30 giorni prima dell'arrivo. Dopo, viene addebitata una notte.",
    rooms: [
      { id: "demo-1a", name: "Classic Double", price: 240, remaining: 6, total: 8 },
      { id: "demo-1b", name: "Junior Suite", price: 320, remaining: 2, total: 4 }
    ]
  },
  {
    id: "demo-2",
    name: "Trullo Bianco Relais",
    stars: 4,
    distance_km: 4.8,
    travel_minutes: 10,
    price_from: 150,
    amenities: ["wifi", "pool", "breakfast", "parking", "ac"],
    photos: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80"
    ],
    address: "Contrada Trito, Alberobello BA, Italy",
    lat: 40.9155, lng: 17.2405,
    phone: "+39 080 000 0002",
    email: "stay@trullobianco.example",
    description_en: "Sleep inside a real trullo. Whitewashed cone-roofed rooms around a shared courtyard, with a small pool and homemade breakfast under the pergola.",
    description_pt: "Durma dentro de um trullo de verdade. Quartos brancos com telhados cônicos ao redor de um pátio, piscina pequena e café da manhã caseiro sob a pérgola.",
    description_it: "Dormi in un vero trullo. Camere bianche con tetto a cono attorno a una corte comune, piccola piscina e colazione fatta in casa sotto il pergolato.",
    cancellation_en: "Free cancellation up to 14 days before arrival.",
    cancellation_pt: "Cancelamento gratuito até 14 dias antes da chegada.",
    cancellation_it: "Cancellazione gratuita fino a 14 giorni prima dell'arrivo.",
    rooms: [
      { id: "demo-2a", name: "Trullo Room", price: 150, remaining: 5, total: 6 },
      { id: "demo-2b", name: "Family Trullo (4 guests)", price: 210, remaining: 1, total: 2 }
    ]
  },
  {
    id: "demo-3",
    name: "Hotel Mare di Polignano",
    stars: 4,
    distance_km: 9.5,
    travel_minutes: 15,
    price_from: 130,
    amenities: ["wifi", "breakfast", "ac", "beach", "restaurant"],
    photos: [
      "https://images.unsplash.com/photo-1566065739035-8148a9aa8548?w=1200&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1611484975261-447f884328e7?w=1200&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1597517298141-403444cefbca?w=1200&q=80&auto=format&fit=crop"
    ],
    address: "Via Roma, Polignano a Mare BA, Italy",
    lat: 40.9950, lng: 17.2180,
    phone: "+39 080 000 0003",
    email: "booking@maredipolignano.example",
    description_en: "A bright seaside hotel a short walk from the cliffs of Polignano a Mare. Great for guests who want beach mornings before the celebrations.",
    description_pt: "Um hotel claro à beira-mar, a poucos passos das falésias de Polignano a Mare. Ótimo para quem quer manhãs de praia antes das festas.",
    description_it: "Un hotel luminoso sul mare, a due passi dalle scogliere di Polignano a Mare. Perfetto per chi vuole una mattinata in spiaggia prima dei festeggiamenti.",
    cancellation_en: "Free cancellation up to 7 days before arrival.",
    cancellation_pt: "Cancelamento gratuito até 7 dias antes da chegada.",
    cancellation_it: "Cancellazione gratuita fino a 7 giorni prima dell'arrivo.",
    rooms: [
      { id: "demo-3a", name: "Double Room", price: 130, remaining: 8, total: 10 },
      { id: "demo-3b", name: "Sea View Double", price: 175, remaining: 0, total: 4 }
    ]
  }
];
