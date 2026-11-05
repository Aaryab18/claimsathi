import { useState } from "react";
import { OMBUDSMAN_BY_STATE, OMBUDSMAN_DISTRICTS, OMBUDSMAN_LOOKUP_URL, OTHER_DISTRICT } from "../lib/ombudsman";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";

export function OmbudsmanFinder({ language }: { language: Language }) {
  const t = translations[language];
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const districts = OMBUDSMAN_DISTRICTS[state];
  const office = districts?.find((item) => item.district === district)?.office;
  const matches = office ? [{ office }] : OMBUDSMAN_BY_STATE[state];

  return (
    <div data-testid="ombudsman-finder" className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E7E5D8] flex flex-col gap-2">
      <label htmlFor="ombudsman-state" className="text-sm font-bold text-[#113A2B]">
        {t.ombudsmanFinderLabel}
      </label>
      <select
        id="ombudsman-state"
        data-testid="ombudsman-state"
        value={state}
        onChange={(e) => {
          setState(e.target.value);
          setDistrict("");
        }}
        className="w-full sm:w-80 px-3 py-2 rounded-lg border border-[#D5D2C2] bg-white text-sm"
      >
        <option value="">{t.ombudsmanChooseState}</option>
        {Object.keys(OMBUDSMAN_BY_STATE).map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      {districts && (
        <>
          <label htmlFor="ombudsman-district" className="text-xs sm:text-sm font-semibold text-[#113A2B]">
            {t.ombudsmanChooseDistrict}
          </label>
          <select
            id="ombudsman-district"
            data-testid="ombudsman-district"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full sm:w-80 px-3 py-2 rounded-lg border border-[#D5D2C2] bg-white text-sm"
          >
            <option value="">{t.ombudsmanChooseDistrict}</option>
            {districts.map((item) => (
              <option key={item.district} value={item.district}>
                {item.district === OTHER_DISTRICT ? t.ombudsmanOtherDistrict : item.district}
              </option>
            ))}
          </select>
        </>
      )}

      {matches && (
        <div data-testid="ombudsman-result" className="text-sm text-[#273B30]">
          <ul className="flex flex-col gap-1">
            {matches.map(({ office, covers }) => (
              <li key={office}>
                <strong>{t.ombudsmanOffice(office)}</strong>
                {covers && <span className="text-[#526059]"> ({covers})</span>}
              </li>
            ))}
          </ul>
          <a
            href={OMBUDSMAN_LOOKUP_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block font-semibold text-[#0F5132] underline"
          >
            {t.ombudsmanContactLink}
          </a>
        </div>
      )}
    </div>
  );
}
