import { useState, useMemo, useCallback, useRef } from 'react';

/* ─── Formatage ────────────────────────────────── */
const CURRENCIES = {
  EUR: { label: 'Euro (€)', symbol: '€', code: 'EUR', locale: 'fr-FR' },
  XOF: { label: 'Franc CFA (F)', symbol: 'F', code: 'XOF', locale: 'fr-FR' },
  USD: { label: 'Dollar ($)', symbol: '$', code: 'USD', locale: 'en-US' },
};

const getFmt = (deviseCode, decimals = 0) => (n) =>
  new Intl.NumberFormat(CURRENCIES[deviseCode].locale, {
    style: 'currency',
    currency: deviseCode,
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n);

const fmtPct = (n) =>
  new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n) + ' %';

/* ─── Calcul mensualité ────────────────────────── */
function mensualite(P, tauxAnnuel, dureeAns) {
  if (P <= 0 || dureeAns <= 0) return 0;
  const n = dureeAns * 12;
  if (tauxAnnuel === 0) return P / n;
  const r = tauxAnnuel / 100 / 12;
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/* ─── Tableau d'amortissement (annuel) ──────────── */
function tableauAmortissement(P, tauxAnnuel, dureeAns, assuranceMensuelle) {
  if (P <= 0 || dureeAns <= 0) return [];
  const r = tauxAnnuel === 0 ? 0 : tauxAnnuel / 100 / 12;
  const M_hors = mensualite(P, tauxAnnuel, dureeAns);
  let solde = P;
  return Array.from({ length: dureeAns }, (_, i) => {
    let interets = 0, capital = 0;
    for (let m = 0; m < 12; m++) {
      const int = solde * r;
      const cap = M_hors - int;
      interets += int;
      capital += cap;
      solde = Math.max(0, solde - cap);
    }
    const assuranceAnnuelle = assuranceMensuelle * 12;
    return { 
      annee: i + 1, 
      mensualites: (M_hors + assuranceMensuelle) * 12, 
      interets, 
      capital, 
      assurance: assuranceAnnuelle,
      solde 
    };
  });
}

/* ─── Champ de saisie directe ───────────────────── */
function Champ({ id, libelle, description, valeur, min, max, pas, affichage, prefixe, suffixe, onChange, hasError }) {
  const [inputValue, setInputValue] = useState(valeur);

  // Sync avec le parent si besoin (ex: calculs externes)
  useMemo(() => setInputValue(valeur), [valeur]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setInputValue(raw); // Update local text immediately
    
    if (raw === '') {
      onChange(0);
    } else {
      const v = parseFloat(raw);
      if (!isNaN(v)) {
        onChange(v);
      }
    }
  };

  return (
    <div className="field">
      <div className="field-top">
        <div className="field-label-group">
          {libelle && <label className="field-name" htmlFor={`${id}-input`}>{libelle}</label>}
          {libelle && description && <div className="field-info-icon" title={description}>i</div>}
        </div>
        <span className="field-display">{affichage(valeur)}</span>
      </div>

      <div className="input-wrap">
        {prefixe && <span className="input-unit left">{prefixe}</span>}
        <input
          id={`${id}-input`}
          type="number"
          value={inputValue}
          min={min}
          max={max}
          step={pas}
          placeholder="0"
          className={[prefixe ? 'pl' : '', suffixe ? 'pr' : '', hasError ? 'error-border' : ''].join(' ')}
          onChange={handleChange}
        />
        {suffixe && <span className="input-unit right">{suffixe}</span>}
      </div>
      <p className="field-description-text">{description}</p>
    </div>
  );
}

/* ─── App principale ────────────────────────────── */
export default function App() {
  const [currency, setCurrency] = useState('EUR');
  const [activeTab, setActiveTab] = useState('sim'); // 'guide', 'sim', 'table'
  const [prixAchat, setPrixAchat] = useState(0);
  const [acompte, setAcompte] = useState(0);
  const [duree, setDuree] = useState(0);
  const [dureeType, setDureeType] = useState('ans'); // 'ans' or 'mois'
  const [taux, setTaux] = useState(3.5);
  const [assuranceRate, setAssuranceRate] = useState(0.3);
  const [notaireRate, setNotaireRate] = useState(7.5);
  const [toutAfficher, setToutAfficher] = useState(false);

  const handleReset = () => {
    setPrixAchat(0);
    setAcompte(0);
    setDuree(0);
    setDureeType('ans');
    setTaux(3.5);
    setAssuranceRate(0.3);
    setNotaireRate(7.5);
  };

  /* Formateurs dynamiques */
  const fmt = useMemo(() => getFmt(currency, 0), [currency]);
  const fmtDec = useMemo(() => getFmt(currency, 2), [currency]);

  /* Dérivés */
  const dureeAns = dureeType === 'ans' ? duree : duree / 12;
  const emprunt = Math.max(0, prixAchat - acompte);
  const erreurAcompte = acompte > prixAchat;
  const erreurPrix = prixAchat <= 0;
  const erreurDuree = emprunt > 0 && duree <= 0;

  const fraisNotaire = (prixAchat * notaireRate) / 100;
  const assuranceMensuelle = (emprunt * assuranceRate) / 100 / 12;
  const M_hors = useMemo(() => mensualite(emprunt, taux, dureeAns), [emprunt, taux, dureeAns]);
  const M_totale = M_hors + assuranceMensuelle;
  
  const totalRemboursement = M_totale * dureeAns * 12;
  const coutInterets = (M_hors * dureeAns * 12) - emprunt;
  const coutAssurance = assuranceMensuelle * dureeAns * 12;
  const coutTotalCredit = coutInterets + coutAssurance;

  const pctApport = prixAchat > 0 ? (acompte / prixAchat) * 100 : 0;
  const pctCapital = totalRemboursement > 0 ? (emprunt / totalRemboursement) * 100 : 100;

  const tableau = useMemo(
    () => tableauAmortissement(emprunt, taux, dureeAns, assuranceMensuelle),
    [emprunt, taux, dureeAns, assuranceMensuelle],
  );

  const isReady = prixAchat > 0 && duree > 0;

  const handleAcompte = useCallback(
    (v) => setAcompte(Math.min(prixAchat, v)),
    [prixAchat],
  );

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <div className="logo">
          <div className="logo-mark">⌂</div>
          <span className="logo-name">SimPrêt</span>
        </div>
        
        <div className="header-actions">
          <button className="reset-btn" onClick={handleReset}>
            <span className="reset-icon">↺</span> Réinitialiser
          </button>
          <select 
            className="currency-select"
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)}
          >
            {Object.entries(CURRENCIES).map(([code, data]) => (
              <option key={code} value={code}>{data.label}</option>
            ))}
          </select>
          <span className="header-tag">Simulateur de prêt</span>
        </div>
      </header>

      {/* ── Navigation ── */}
      <nav className="nav-tabs">
        <button 
          className={activeTab === 'guide' ? 'active' : ''} 
          onClick={() => setActiveTab('guide')}
        >
          Guide d'utilisation
        </button>
        <button 
          className={activeTab === 'sim' ? 'active' : ''} 
          onClick={() => setActiveTab('sim')}
        >
          Simulateur
        </button>
        <button 
          className={activeTab === 'table' ? 'active' : ''} 
          onClick={() => setActiveTab('table')}
        >
          Tableau d'amortissement
        </button>
      </nav>

      {/* ── Hero (Uniquement sur l'accueil ou le simulateur) ── */}
      {activeTab === 'sim' && (
        <section className="hero">
          <h1>Votre <em>prêt immobilier</em> en quelques clics</h1>
          <p>Renseignez les paramètres de votre projet et obtenez une estimation de vos mensualités instantanément.</p>
        </section>
      )}

      {/* ── Contenu par onglet ── */}
      <main className="main-content">

        {/* ONGLET : GUIDE */}
        {activeTab === 'guide' && (
          <div className="tab-pane">
            <section className="hero no-border">
              <h1>Comment <em>l'utiliser</em> ?</h1>
              <p>Maîtrisez les outils de simulation pour optimiser votre plan de financement.</p>
            </section>
            <div className="intro-section full-width">
              <div className="intro-grid">
                <div className="step-card">
                  <div className="step-num">1</div>
                  <h3>Saisissez vos données</h3>
                  <p>Entrez le prix d'achat du bien et le montant de votre apport personnel initial.</p>
                </div>
                <div className="step-card">
                  <div className="step-num">2</div>
                  <h3>Ajustez les conditions</h3>
                  <p>Définissez la durée du remboursement et le taux d'intérêt annuel souhaité.</p>
                </div>
                <div className="step-card">
                  <div className="step-num">3</div>
                  <h3>Analysez les résultats</h3>
                  <p>Visualisez instantanément votre mensualité estimée et le coût total de votre crédit.</p>
                </div>
                <div className="step-card">
                  <div className="step-num">4</div>
                  <h3>Explorez le tableau</h3>
                  <p>Consultez l'amortissement annuel pour voir l'évolution de votre capital restant dû.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET : SIMULATEUR */}
        {activeTab === 'sim' && (
          <div className="tab-pane">
            <div className="main">
              {/* Carte unique des paramètres */}
              <div className="card full-width">
                <p className="card-label">Paramètres de votre projet</p>
                <div className="inputs-grid">
                  <Champ
                    id="prix"
                    libelle="Prix d'achat"
                    description="Prix de vente du bien immobilier tel qu'affiché dans l'annonce (net vendeur)."
                    valeur={prixAchat}
                    min={0}
                    max={100_000_000}
                    pas={1000}
                    affichage={fmt}
                    prefixe={CURRENCIES[currency].symbol}
                    onChange={setPrixAchat}
                    hasError={erreurPrix}
                  />

                  <Champ
                    id="acompte"
                    libelle="Apport personnel"
                    description="Part de votre épargne personnelle que vous injectez directement dans l'achat."
                    valeur={acompte}
                    min={0}
                    max={100_000_000}
                    pas={500}
                    affichage={fmt}
                    prefixe={CURRENCIES[currency].symbol}
                    onChange={handleAcompte}
                    hasError={erreurAcompte}
                  />

                  <div className="field">
                    <div className="field-top">
                      <div className="field-label-group">
                        <label className="field-name">Durée d'emprunt</label>
                        <div className="field-info-icon" title="Nombre d'années ou de mois pendant lesquels vous rembourserez vos mensualités.">i</div>
                      </div>
                      <div className="unit-toggle-group">
                        <button 
                          className={`unit-toggle-btn ${dureeType === 'ans' ? 'active' : ''}`}
                          onClick={() => setDureeType('ans')}
                        >
                          Ans
                        </button>
                        <button 
                          className={`unit-toggle-btn ${dureeType === 'mois' ? 'active' : ''}`}
                          onClick={() => setDureeType('mois')}
                        >
                          Mois
                        </button>
                      </div>
                    </div>
                    <Champ
                      id="duree"
                      libelle="" // Label déjà géré au-dessus pour le toggle
                      description="Indiquez la durée totale de votre prêt."
                      valeur={duree}
                      min={0}
                      max={dureeType === 'ans' ? 50 : 600}
                      pas={1}
                      affichage={(v) => dureeType === 'ans' ? `${v} an${v > 1 ? 's' : ''}` : `${v} mois`}
                      suffixe={dureeType}
                      onChange={setDuree}
                      hasError={erreurDuree}
                    />
                  </div>

                  <Champ
                    id="taux"
                    libelle="Taux d'intérêt annuel"
                    description="Taux débiteur (hors assurance) appliqué par la banque sur le capital emprunté."
                    valeur={taux}
                    min={0}
                    max={20}
                    pas={0.01}
                    affichage={(v) =>
                      new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + ' %'
                    }
                    suffixe="%"
                    onChange={setTaux}
                  />

                  <Champ
                    id="assurance"
                    libelle="Assurance emprunteur (TAEA)"
                    description="Le Taux Annuel Effectif de l'Assurance. Couvre les risques d'invalidité, décès ou perte d'emploi."
                    valeur={assuranceRate}
                    min={0}
                    max={10}
                    pas={0.01}
                    affichage={(v) =>
                      new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + ' %'
                    }
                    suffixe="%"
                    onChange={setAssuranceRate}
                  />

                  <Champ
                    id="notaire"
                    libelle="Frais de notaire"
                    description="Taxes collectées par le notaire pour l'État (enregistrement, publicité foncière)."
                    valeur={notaireRate}
                    min={0}
                    max={25}
                    pas={0.1}
                    affichage={(v) =>
                      new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v) + ' %'
                    }
                    suffixe="%"
                    onChange={setNotaireRate}
                  />
                </div>

                <div className="field-errors">
                  {erreurPrix && (
                    <div className="field-error">Le prix d'achat doit être supérieur à zéro.</div>
                  )}
                  {erreurAcompte && (
                    <div className="field-error">L'apport ne peut pas dépasser le prix d'achat.</div>
                  )}
                  {erreurDuree && (
                    <div className="field-error">Veuillez indiquer une durée de remboursement.</div>
                  )}
                </div>

                <div className="divider" />

                <div className="ratio-row">
                  <span>Apport</span>
                  <span>Apport {Math.round(pctApport)}%</span>
                </div>
                <div className="ratio-bar">
                  <div className="ratio-fill" style={{ width: `${pctApport}%` }} />
                </div>

                <div className="ratio-row" style={{ marginTop: 24 }}>
                  <span>Capital vs intérêts</span>
                  <span>Capital {Math.round(pctCapital)}% / Intérêts {Math.round(100 - pctCapital)}%</span>
                </div>
                <div className="ratio-bar">
                  <div className="ratio-fill" style={{ width: `${pctCapital}%`, background: 'var(--green)' }} />
                  <div className="ratio-fill" style={{ width: `${100 - pctCapital}%`, background: 'var(--red)' }} />
                </div>
              </div>

              {/* Résultats ou État Vide */}
              {isReady ? (
                <div className="card results-card">
                  <p className="card-label">Résultats de la simulation</p>
                  <div className="results-grid">
                    <div className="result-block">
                      <div className="result-block-label">Montant emprunté</div>
                      <div className="result-block-value">{fmt(emprunt)}</div>
                      <div className="result-block-sub">Prix d'achat − Apport</div>
                    </div>

                    <div className="result-block">
                      <div className="result-block-label">Frais de notaire</div>
                      <div className="result-block-value">{fmt(fraisNotaire)}</div>
                      <div className="result-block-sub">Estimation à {notaireRate}%</div>
                    </div>

                    <div className="result-block">
                      <div className="result-block-label">Coût total crédit</div>
                      <div className="result-block-value">{fmt(coutTotalCredit)}</div>
                      <div className="result-block-sub">dont intérêts : {fmt(coutInterets)}</div>
                    </div>

                    <div className="result-block">
                      <div className="result-block-label">Mensualité (hors assurance)</div>
                      <div className="result-block-value">{fmtDec(M_hors)}</div>
                    </div>

                    <div className="result-block">
                      <div className="result-block-label">Assurance / mois</div>
                      <div className="result-block-value">{fmtDec(assuranceMensuelle)}</div>
                    </div>

                    <div className="result-block featured">
                      <div className="result-block-label">Mensualité totale</div>
                      <div className="result-block-value">{fmtDec(M_totale)}</div>
                      <div className="result-block-sub">Assurance incluse</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card empty-results">
                  <div className="empty-content">
                    <div className="empty-icon">📊</div>
                    <h3>Simulation en attente</h3>
                    <p>Veuillez renseigner le <strong>prix d'achat</strong> et la <strong>durée d'emprunt</strong> pour voir vos résultats apparaître ici.</p>
                  </div>
                </div>
              )}
              
              {/* Accès rapide au tableau */}
              <div style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                <button className="toggle-btn-large" onClick={() => setActiveTab('table')}>
                  Consulter le tableau d'amortissement complet ➔
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET : TABLEAU */}
        {activeTab === 'table' && (
          <div className="tab-pane">
            <div className="main full-view">
              <div className="card table-card">
                <div className="table-head">
                  <p className="card-label" style={{ marginBottom: 0 }}>Tableau d'amortissement annuel</p>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  {isReady ? (
                    <table className="amort-table">
                      <thead>
                        <tr>
                          <th>Année</th>
                          <th>Total versé</th>
                          <th>Intérêts</th>
                          <th>Assurance</th>
                          <th>Capital</th>
                          <th>Solde restant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableau.map((r) => (
                          <tr key={r.annee}>
                            <td>Année {r.annee}</td>
                            <td>{fmtDec(r.mensualites)}</td>
                            <td className="col-int">{fmtDec(r.interets)}</td>
                            <td className="col-assurance">{fmtDec(r.assurance)}</td>
                            <td className="col-cap">{fmtDec(r.capital)}</td>
                            <td>{fmtDec(r.solde)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-results mini">
                      <div className="empty-content">
                        <div className="empty-icon">📂</div>
                        <h3>Tableau indisponible</h3>
                        <p>Configurez les paramètres de base pour générer le tableau d'amortissement annuel.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        Simulation indicative — Les taux réels peuvent varier selon votre profil et votre banque.
      </footer>
    </div>
  );
}
