import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib';
import { DOG_BREEDS, CAT_BREEDS, ALLERGY_OPTIONS } from '../config/breeds';
import { Check, Search, ArrowRight, ShieldAlert } from 'lucide-react';

export const OnboardingView: React.FC = () => {
  const { user } = useAuth();
  const { loadPets } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [species, setSpecies] = useState<'dog' | 'cat'>('dog');
  const [soundLabel, setSoundLabel] = useState<{ dog: string; cat: string }>({
    dog: 'Dog',
    cat: 'Cat',
  });

  // Pet details form state
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [breedSearch, setBreedSearch] = useState('');
  const [showBreedPicker, setShowBreedPicker] = useState(false);
  const [ageYears, setAgeYears] = useState(2);
  const [ageMonths, setAgeMonths] = useState(6);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [otherRestriction, setOtherRestriction] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const breedsList = species === 'dog' ? DOG_BREEDS : CAT_BREEDS;
  const filteredBreeds = breedsList.filter((b) =>
    b.toLowerCase().includes(breedSearch.toLowerCase())
  );

  const handleSelectSpecies = (chosen: 'dog' | 'cat') => {
    setSpecies(chosen);
    if (chosen === 'dog') {
      setSoundLabel((prev) => ({ ...prev, dog: 'woof woof! 🐾' }));
    } else {
      setSoundLabel((prev) => ({ ...prev, cat: 'meow! 🐱' }));
    }
  };

  const toggleRestriction = (res: string) => {
    setSelectedRestrictions((prev) =>
      prev.includes(res) ? prev.filter((r) => r !== res) : [...prev, res]
    );
  };

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setSubmitting(true);
    try {
      const finalRestrictions = [...selectedRestrictions];
      if (selectedRestrictions.includes('Other') && otherRestriction.trim()) {
        finalRestrictions.push(otherRestriction.trim());
      }

      await api.createPet({
        owner_id: user.id,
        name: name.trim(),
        species,
        breed: breed || (species === 'dog' ? 'Indie / Indian Pariah' : 'Domestic Shorthair'),
        age_years: ageYears,
        age_months: ageMonths,
        restrictions: finalRestrictions,
      });

      await loadPets();
      navigate('/');
    } catch (err) {
      console.error('Failed to create pet', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      {step === 1 ? (
        <div className="space-y-6 pt-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f28a4b] block mb-1">
              Welcome to Zoomies
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#3b2923] dark:text-[#f5ebe3]">
              Who's your pet?
            </h1>
            <p className="text-xs text-[#6f5c54] dark:text-[#c1b2a9] mt-1">
              Tap below so we can tailor fresh home-cooked bowls for them.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Dog Card */}
            <div
              onClick={() => handleSelectSpecies('dog')}
              className={`w-full h-44 rounded-3xl p-5 cursor-pointer relative flex flex-col items-center justify-center transition-all ${
                species === 'dog'
                  ? 'bg-[#dcedf3] dark:bg-[#24383e] border-2 border-[#3b2923] dark:border-[#a9d2e2] shadow-lg scale-[1.02]'
                  : 'bg-[#dcedf3]/60 dark:bg-[#24383e]/50 border-2 border-transparent hover:border-[#3b2923]/30'
              }`}
            >
              <span className="text-6xl animate-bounce">🐶</span>
              <strong className="text-2xl font-bold mt-2 text-[#3b2923] dark:text-[#f5ebe3] transition-all">
                {soundLabel.dog}
              </strong>
              <small className="text-xs text-[#6f5c54] dark:text-[#c1b2a9]">
                Fresh human-grade chicken, stews & treats
              </small>
              {species === 'dog' && (
                <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#3b2923] dark:bg-[#a9d2e2] text-white dark:text-[#1f1b19] flex items-center justify-center">
                  <Check size={16} />
                </div>
              )}
            </div>

            {/* Cat Card */}
            <div
              onClick={() => handleSelectSpecies('cat')}
              className={`w-full h-44 rounded-3xl p-5 cursor-pointer relative flex flex-col items-center justify-center transition-all ${
                species === 'cat'
                  ? 'bg-[#f7e1e4] dark:bg-[#402e32] border-2 border-[#3b2923] dark:border-[#eebfc6] shadow-lg scale-[1.02]'
                  : 'bg-[#f7e1e4]/60 dark:bg-[#402e32]/50 border-2 border-transparent hover:border-[#3b2923]/30'
              }`}
            >
              <span className="text-6xl animate-bounce">🐱</span>
              <strong className="text-2xl font-bold mt-2 text-[#3b2923] dark:text-[#f5ebe3] transition-all">
                {soundLabel.cat}
              </strong>
              <small className="text-xs text-[#6f5c54] dark:text-[#c1b2a9]">
                Delicate broths, tuna feasts & pure meats
              </small>
              {species === 'cat' && (
                <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#3b2923] dark:bg-[#eebfc6] text-white dark:text-[#1f1b19] flex items-center justify-center">
                  <Check size={16} />
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full h-13 rounded-2xl bg-[#3b2923] dark:bg-[#f28a4b] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all mt-6"
          >
            <span>Continue to Details</span>
            <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        /* STEP 2: Pet Details */
        <form onSubmit={handleSavePet} className="space-y-5 pt-2">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                species === 'dog' ? 'bg-[#dcedf3]' : 'bg-[#f7e1e4]'
              }`}
            >
              {species === 'dog' ? '🐶' : '🐱'}
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f28a4b] block">
                Step 2 of 2
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#3b2923] dark:text-[#f5ebe3]">
                Tell us about your pet
              </h1>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6f5c54] dark:text-[#c1b2a9] mb-1">
              Pet Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bruno, Bella, Rocky"
              className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] text-sm text-[#3b2923] dark:text-[#f5ebe3] outline-none focus:ring-2 focus:ring-[#f28a4b]"
            />
          </div>

          {/* Breed search */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6f5c54] dark:text-[#c1b2a9] mb-1">
              Breed
            </label>
            <div className="relative">
              <input
                type="text"
                value={breed || breedSearch}
                onFocus={() => setShowBreedPicker(true)}
                onChange={(e) => {
                  setBreedSearch(e.target.value);
                  setBreed(e.target.value);
                  setShowBreedPicker(true);
                }}
                placeholder="Search breed (e.g. Indie, Labrador...)"
                className="w-full h-12 pl-4 pr-10 rounded-xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] text-sm text-[#3b2923] dark:text-[#f5ebe3] outline-none focus:ring-2 focus:ring-[#f28a4b]"
              />
              <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9b8b84]" />
            </div>

            {showBreedPicker && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] shadow-lg p-1.5 z-20 space-y-1">
                {filteredBreeds.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      setBreed(b);
                      setBreedSearch('');
                      setShowBreedPicker(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[#fff0e5] dark:hover:bg-[#3d2c24] text-[#3b2923] dark:text-[#f5ebe3] transition-colors"
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Age (Years & Months) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6f5c54] dark:text-[#c1b2a9] mb-1">
                Age (Years)
              </label>
              <select
                value={ageYears}
                onChange={(e) => setAgeYears(Number(e.target.value))}
                className="w-full h-12 px-3 rounded-xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] text-sm text-[#3b2923] dark:text-[#f5ebe3] outline-none focus:ring-2 focus:ring-[#f28a4b]"
              >
                {Array.from({ length: 21 }, (_, i) => (
                  <option key={i} value={i}>
                    {i} {i === 1 ? 'year' : 'years'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6f5c54] dark:text-[#c1b2a9] mb-1">
                Months
              </label>
              <select
                value={ageMonths}
                onChange={(e) => setAgeMonths(Number(e.target.value))}
                className="w-full h-12 px-3 rounded-xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] text-sm text-[#3b2923] dark:text-[#f5ebe3] outline-none focus:ring-2 focus:ring-[#f28a4b]"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {i} {i === 1 ? 'month' : 'months'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Allergies / Dietary restrictions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6f5c54] dark:text-[#c1b2a9] mb-1">
              Dietary Restrictions / Allergies
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {ALLERGY_OPTIONS.map((opt) => {
                const isSelected = selectedRestrictions.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleRestriction(opt)}
                    className={`h-9 px-3.5 rounded-full text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-[#3b2923] dark:bg-[#f28a4b] text-white border-transparent'
                        : 'bg-white dark:bg-[#292421] text-[#6f5c54] dark:text-[#c1b2a9] border-[#e9ded2] dark:border-[#443a35]'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {selectedRestrictions.includes('Other') && (
              <input
                type="text"
                value={otherRestriction}
                onChange={(e) => setOtherRestriction(e.target.value)}
                placeholder="Specify allergy / condition"
                className="mt-2 w-full h-11 px-3 rounded-xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] text-xs text-[#3b2923] dark:text-[#f5ebe3] outline-none"
              />
            )}

            {/* Crucial Subtitle required in prompt */}
            <div className="mt-3 p-3 rounded-xl bg-[#fff0e5] dark:bg-[#3d2c24] text-[#6f5c54] dark:text-[#c1b2a9] text-[11px] leading-relaxed flex items-start gap-2 border border-[#f28a4b]/20">
              <ShieldAlert size={16} className="text-[#f28a4b] shrink-0 mt-0.5" />
              <span>On every order you place, our team is notified of these restrictions.</span>
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-13 px-4 rounded-2xl border border-[#e9ded2] dark:border-[#443a35] text-xs font-bold text-[#6f5c54] dark:text-[#c1b2a9]"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex-1 h-13 rounded-2xl bg-[#3b2923] dark:bg-[#f28a4b] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save & Open Menu'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
