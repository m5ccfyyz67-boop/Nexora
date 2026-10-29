import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  Bike,
  Car,
  CheckCircle2,
  Clock3,
  History,
  Home,
  MapPin,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import type { Database, RideCategory } from '../../types/database';
import { cancelRideRequest, createRideRequest, listMyRides, type RideSummary } from '../../lib/rides';
import { isRideActive, isRideCancellable, rideStatusLabels } from './ride-state';

type Screen = 'home' | 'booking' | 'tracking' | 'packages' | 'wallet' | 'history' | 'profile';
type PassengerAppProps = {
  client: SupabaseClient<Database>;
  user: User;
  onSignOut: () => Promise<void>;
};

const categories: { id: RideCategory; label: string; detail: string }[] = [
  { id: 'economique', label: 'Économique', detail: 'Un trajet simple et pratique' },
  { id: 'confort', label: 'Confort', detail: 'Plus d’espace pour votre trajet' },
  { id: 'premium', label: 'Premium', detail: 'Une expérience haut de gamme' },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function PassengerApp({ client, user, onSignOut }: PassengerAppProps) {
  const [screen, setScreen] = useState<Screen>('home');
  const [rides, setRides] = useState<RideSummary[]>([]);
  const [profileName, setProfileName] = useState('');
  const [loadingRides, setLoadingRides] = useState(false);
  const [ridesError, setRidesError] = useState('');
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState<RideCategory>('economique');
  const [submittingRide, setSubmittingRide] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [cancellingRide, setCancellingRide] = useState(false);
  const [cancellationError, setCancellationError] = useState('');
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const requestId = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void client.from('profiles').select('full_name').maybeSingle().then(({ data }) => {
      if (mounted && data?.full_name) setProfileName(data.full_name);
    });
    return () => { mounted = false; };
  }, [client, user.id]);

  useEffect(() => {
    let mounted = true;
    setLoadingRides(true);
    setRidesError('');
    void listMyRides(client)
      .then((rows) => { if (mounted) setRides(rows); })
      .catch((error: unknown) => {
        if (mounted) setRidesError(error instanceof Error ? error.message : 'Impossible de charger les courses.');
      })
      .finally(() => { if (mounted) setLoadingRides(false); });
    return () => { mounted = false; };
  }, [client, screen, selectedRideId, historyRefresh]);

  const activeRide = useMemo(
    () => rides.find((ride) => ride.id === selectedRideId) ?? rides.find((ride) => isRideActive(ride.status)),
    [rides, selectedRideId],
  );
  const firstName = profileName.trim().split(/\s+/)[0] || user.email?.split('@')[0] || 'Passager';

  function open(next: Screen) {
    setScreen(next);
    setCancellationError('');
  }

  async function handleRequestRide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingError('');
    setSubmittingRide(true);
    requestId.current ??= crypto.randomUUID();
    try {
      const rideId = await createRideRequest(client, {
        pickup: departure.trim(),
        destination: destination.trim(),
        category,
        requestId: requestId.current,
      });
      requestId.current = null;
      setSelectedRideId(rideId);
      setScreen('tracking');
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'La demande n’a pas pu être enregistrée. Réessayez.');
    } finally {
      setSubmittingRide(false);
    }
  }

  async function handleCancelRide(ride: RideSummary) {
    if (!isRideCancellable(ride.status, Boolean(ride.driver_user_id))) return;
    setCancellationError('');
    setCancellingRide(true);
    try {
      await cancelRideRequest(client, ride.id);
      setHistoryRefresh((value) => value + 1);
    } catch (error) {
      setCancellationError(error instanceof Error ? error.message : 'La demande n’a pas pu être annulée. Réessayez.');
    } finally {
      setCancellingRide(false);
    }
  }

  function startAnotherRide() {
    setSelectedRideId(null);
    open('booking');
  }

  return (
    <div className="app-shell">
      <aside className="desktop-sidebar">
        <BrandMark />
        <div className="sidebar-caption">ESPACE PASSAGER</div>
        <nav className="sidebar-nav" aria-label="Navigation principale">
          <NavItem label="Accueil" icon={<Home size={18} />} active={screen === 'home'} onClick={() => open('home')} />
          <NavItem label="Réserver" icon={<Car size={18} />} active={screen === 'booking'} onClick={() => open('booking')} />
          <NavItem label="Mes trajets" icon={<History size={18} />} active={screen === 'history' || screen === 'tracking'} onClick={() => open('history')} />
          <NavItem label="Portefeuille" icon={<Wallet size={18} />} active={screen === 'wallet' || screen === 'packages'} onClick={() => open('wallet')} />
          <NavItem label="Profil" icon={<UserRound size={18} />} active={screen === 'profile'} onClick={() => open('profile')} />
        </nav>
        <div className="sidebar-footer"><span className="online-dot" /> Supabase connecté</div>
      </aside>

      <main className="main-column">
        <header className="topbar">
          <div className="mobile-brand"><BrandMark compact /></div>
          <div className="topbar-note">Mobilité urbaine · Abidjan</div>
          <button className="avatar-button" type="button" onClick={() => open('profile')} aria-label="Ouvrir le profil">
            {(firstName[0] || 'N').toUpperCase()}
          </button>
        </header>

        <div className="page-content">
          {screen === 'home' && (
            <section className="screen-stack">
              <div className="welcome-copy">
                <div className="eyebrow">VOTRE MOBILITÉ, EN TOUTE SIMPLICITÉ</div>
                <h1>Bonjour, {firstName}.</h1>
                <p>Où souhaitez-vous aller aujourd’hui ?</p>
              </div>
              <button className="hero-booking-card" onClick={() => open('booking')} type="button">
                <span className="hero-icon"><Car size={24} /></span>
                <span className="hero-text"><strong>Réserver un trajet</strong><small>Départ, destination, catégorie</small></span>
                <ArrowRight size={18} />
              </button>
              <section className="surface-card wallet-preview">
                <div className="card-topline"><div><div className="eyebrow">PORTEFEUILLE</div><h2>Kilomètres Nexora</h2></div><Wallet size={19} /></div>
                <p className="pending-balance">Solde indisponible</p>
                <p className="muted-copy">Le portefeuille KM sera activé après validation de ses règles et offres.</p>
                <button className="button button-quiet" onClick={() => open('wallet')} type="button">Voir le portefeuille <ArrowRight size={15} /></button>
              </section>
              <div className="section-heading"><div><div className="eyebrow">SERVICES</div><h2>Choisissez votre mobilité</h2></div></div>
              <div className="service-list">
                <button className="service-card service-active" type="button" onClick={() => open('booking')}><span className="service-icon"><Car size={20} /></span><span><strong>VTC</strong><small>Réservation disponible</small></span><ArrowRight size={16} /></button>
                <div className="service-card service-disabled"><span className="service-icon"><Bike size={20} /></span><span><strong>Moto</strong><small>À configurer</small></span><span className="status-pill">Bientôt</span></div>
                <div className="service-card service-disabled"><span className="service-icon"><Truck size={20} /></span><span><strong>Livraison</strong><small>À configurer</small></span><span className="status-pill">Bientôt</span></div>
              </div>
              {activeRide && (
                <button className="active-ride-card" type="button" onClick={() => { setSelectedRideId(activeRide.id); open('tracking'); }}>
                  <span><Clock3 size={18} /><strong>Demande en cours</strong></span>
                  <small>{rideStatusLabels[activeRide.status]}</small>
                </button>
              )}
            </section>
          )}

          {screen === 'booking' && (
            <section className="screen-stack narrow-screen">
              <ScreenHeading eyebrow="NOUVELLE COURSE" title="Votre prochain trajet" onBack={() => open('home')} />
              <div className="map-placeholder" aria-label="Carte non configurée">
                <div className="map-grid" /><div className="map-center-icon"><MapPin size={22} /></div>
                <span className="map-label">Cartographie non configurée</span>
              </div>
              <form className="surface-card booking-form" onSubmit={handleRequestRide}>
                <label className="field-label">Point de départ
                  <span className="input-wrap"><span className="location-dot pickup-dot" /><input value={departure} onChange={(event) => { requestId.current = null; setDeparture(event.target.value); }} required minLength={2} maxLength={300} placeholder="Saisir le lieu de départ" /></span>
                </label>
                <label className="field-label">Destination
                  <span className="input-wrap"><MapPin size={17} /><input value={destination} onChange={(event) => { requestId.current = null; setDestination(event.target.value); }} required minLength={2} maxLength={300} placeholder="Saisir la destination" /></span>
                </label>
                <div className="field-label">Catégorie</div>
                <div className="category-list">
                  {categories.map((item) => (
                    <button className={`category-option ${category === item.id ? 'selected' : ''}`} key={item.id} onClick={() => { requestId.current = null; setCategory(item.id); }} type="button" aria-pressed={category === item.id}>
                      <span className="category-radio" /><span><strong>{item.label}</strong><small>{item.detail}</small></span>
                    </button>
                  ))}
                </div>
                <InlineNotice>La demande sera enregistrée, mais aucun chauffeur, itinéraire, délai ou prix n’est encore attribué par le système.</InlineNotice>
                {bookingError && <p className="form-message error-message" role="alert">{bookingError}</p>}
                <button className="button button-primary button-full" type="submit" disabled={submittingRide}>{submittingRide ? 'Enregistrement…' : 'Enregistrer la demande'}</button>
              </form>
            </section>
          )}

          {screen === 'tracking' && (
            <section className="screen-stack narrow-screen">
              <ScreenHeading eyebrow="SUIVI DE COURSE" title="État de la demande" onBack={() => open('home')} />
              {activeRide?.status === 'cancelled' ? (
                <EmptyState icon={<X size={22} />} title="Demande annulée" detail="La demande non attribuée a été annulée. Vous pouvez réserver un nouveau trajet." action="Réserver à nouveau" onAction={startAnotherRide} />
              ) : activeRide ? (
                <>
                  <div className="tracking-map map-placeholder"><div className="map-grid" /><div className="tracking-status-icon"><Clock3 size={22} /></div><span className="map-label">Suivi GPS non activé</span></div>
                  <div className="surface-card tracking-card">
                    <span className="status-pill status-gold">{rideStatusLabels[activeRide.status]}</span>
                    <h2>{activeRide.pickup_label}</h2><div className="route-divider" /><h2>{activeRide.dropoff_label}</h2>
                    <div className="tracking-meta"><span>{categories.find((item) => item.id === activeRide.category)?.label}</span><span>{formatDate(activeRide.requested_at)}</span></div>
                  </div>
                  <InlineNotice>La demande est bien enregistrée. La mise en relation avec un chauffeur n’est pas activée dans ce premier lot.</InlineNotice>
                  {ridesError && <p className="form-message error-message" role="alert">{ridesError}</p>}
                  {cancellationError && <p className="form-message error-message" role="alert">{cancellationError}</p>}
                  <div className="tracking-actions">
                    <button className="button button-quiet" type="button" onClick={() => setHistoryRefresh((value) => value + 1)}><RefreshCw size={15} /> Actualiser l’état</button>
                    {isRideCancellable(activeRide.status, Boolean(activeRide.driver_user_id)) && (
                      <button className="button button-danger" type="button" disabled={cancellingRide} onClick={() => void handleCancelRide(activeRide)}>
                        {cancellingRide ? 'Annulation…' : 'Annuler la demande'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <EmptyState icon={<MapPin size={22} />} title="Aucune demande active" detail="Votre dernière course n’est pas en cours. Vous pouvez démarrer une nouvelle réservation." action="Réserver un trajet" onAction={startAnotherRide} />
              )}
            </section>
          )}

          {screen === 'packages' && (
            <section className="screen-stack narrow-screen">
              <ScreenHeading eyebrow="OFFRES NEXORA" title="Forfaits kilomètres" onBack={() => open('wallet')} />
              <div className="surface-card package-placeholder"><span className="large-icon"><PackageCheck size={25} /></span><h2>Offres à confirmer</h2><p className="muted-copy">Les montants et durées de la démo sont des exemples. Aucun forfait réel n’est publié ni achetable dans cette version.</p><InlineNotice>Le catalogue sera activé après validation du prix, de la validité, du paiement et des règles d’utilisation.</InlineNotice></div>
            </section>
          )}

          {screen === 'wallet' && (
            <section className="screen-stack narrow-screen">
              <ScreenHeading eyebrow="ESPACE PASSAGER" title="Mon portefeuille" onBack={() => open('home')} />
              <div className="surface-card wallet-empty"><div className="large-icon"><Wallet size={25} /></div><div className="eyebrow">SOLDE KILOMÈTRES</div><h2>Non activé</h2><p className="muted-copy">Aucun solde fictif n’est affiché. Le portefeuille et les transactions seront raccordés après validation du modèle KM.</p><button className="button button-secondary" onClick={() => open('packages')} type="button">Voir les forfaits à confirmer <ArrowRight size={15} /></button></div>
              <div className="section-heading"><div><div className="eyebrow">HISTORIQUE</div><h2>Vos mouvements</h2></div></div>
              <EmptyState icon={<ArrowDownLeft size={20} />} title="Aucun mouvement" detail="Les mouvements de kilomètres ne sont pas encore activés." />
            </section>
          )}

          {screen === 'history' && (
            <section className="screen-stack narrow-screen">
              <ScreenHeading eyebrow="VOTRE ACTIVITÉ" title="Mes trajets" onBack={() => open('home')} />
              {ridesError && <p className="form-message error-message" role="alert">{ridesError}</p>}
              {loadingRides ? <LoadingState label="Chargement des trajets…" /> : rides.length ? (
                <div className="ride-list">{rides.map((ride) => <button className="ride-row surface-card" type="button" key={ride.id} onClick={() => { setSelectedRideId(ride.id); open(isRideActive(ride.status) ? 'tracking' : 'history'); }}>
                  <span className="ride-row-icon"><Car size={17} /></span><span className="ride-row-copy"><strong>{ride.pickup_label}</strong><small>{ride.dropoff_label}</small><small>{formatDate(ride.requested_at)}</small></span>
                  <span className={`status-pill ${['completed', 'cancelled', 'no_driver'].includes(ride.status) ? 'status-muted' : 'status-gold'}`}>{rideStatusLabels[ride.status]}</span>
                </button>)}</div>
              ) : <EmptyState icon={<History size={22} />} title="Votre historique apparaîtra ici" detail="Aucun trajet n’est encore associé à ce compte." />}
              <button className="button button-quiet" type="button" onClick={() => setHistoryRefresh((value) => value + 1)}><RefreshCw size={15} /> Actualiser</button>
            </section>
          )}

          {screen === 'profile' && (
            <section className="screen-stack narrow-screen">
              <ScreenHeading eyebrow="ESPACE PASSAGER" title="Mon profil" onBack={() => open('home')} />
              <div className="surface-card profile-card"><div className="profile-avatar">{(firstName[0] || 'N').toUpperCase()}</div><div><h2>{profileName || firstName}</h2><p className="muted-copy">{user.email}</p></div><CheckCircle2 size={19} className="verified-icon" /></div>
              <div className="surface-card profile-settings"><div><ShieldCheck size={18} /><span>Compte authentifié par Supabase</span></div><div><MapPin size={18} /><span>Région de lancement prévue : Abidjan</span></div></div>
              <button className="button button-danger button-full" type="button" onClick={() => void onSignOut()}><X size={16} /> Se déconnecter</button>
            </section>
          )}
        </div>

        <nav className="mobile-bottom-nav" aria-label="Navigation mobile">
          <NavItem label="Accueil" icon={<Home size={19} />} active={screen === 'home'} onClick={() => open('home')} compact />
          <NavItem label="Trajets" icon={<History size={19} />} active={screen === 'history' || screen === 'tracking'} onClick={() => open('history')} compact />
          <button className={`mobile-book-button ${screen === 'booking' ? 'active' : ''}`} type="button" onClick={() => open('booking')} aria-label="Réserver"><Car size={20} /></button>
          <NavItem label="Portefeuille" icon={<Wallet size={19} />} active={screen === 'wallet' || screen === 'packages'} onClick={() => open('wallet')} compact />
          <NavItem label="Profil" icon={<UserRound size={19} />} active={screen === 'profile'} onClick={() => open('profile')} compact />
        </nav>
      </main>
    </div>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return <div className={`brand-mark ${compact ? 'brand-compact' : ''}`}><span className="brand-symbol">N</span><span className="brand-wordmark"><strong>NEXORA</strong><small>MOBILITY</small></span></div>;
}

function NavItem({ label, icon, active, onClick, compact = false }: { label: string; icon: ReactNode; active: boolean; onClick: () => void; compact?: boolean }) {
  return <button className={`${compact ? 'mobile-nav-item' : 'sidebar-nav-item'} ${active ? 'active' : ''}`} type="button" onClick={onClick} aria-current={active ? 'page' : undefined}>{icon}<span>{label}</span></button>;
}

function ScreenHeading({ eyebrow, title, onBack }: { eyebrow: string; title: string; onBack: () => void }) {
  return <div className="screen-heading"><button className="icon-button" type="button" onClick={onBack} aria-label="Retour"><ArrowLeft size={18} /></button><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1></div></div>;
}

function InlineNotice({ children }: { children: ReactNode }) {
  return <div className="notice-card"><ShieldCheck size={18} /><p>{children}</p></div>;
}

function EmptyState({ icon, title, detail, action, onAction }: { icon: ReactNode; title: string; detail: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state surface-card"><span className="empty-icon">{icon}</span><h2>{title}</h2><p className="muted-copy">{detail}</p>{action && onAction && <button className="button button-secondary" type="button" onClick={onAction}>{action}<ArrowRight size={15} /></button>}</div>;
}

function LoadingState({ label }: { label: string }) {
  return <div className="loading-state"><span className="spinner" />{label}</div>;
}
