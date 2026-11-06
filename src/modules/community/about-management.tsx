"use client";
import { useState } from "react";
import { PeopleEditor } from "./people-editor";
import { PlacesEditor } from "../site-settings/ui/places-editor";
import styles from "../site-settings/ui/admin-editors.module.css";

export function AboutManagement() {
  const [tab, setTab] = useState<"people" | "places">("people");

  return (
    <div>
      <div className={styles.tabs} style={{ marginBottom: "24px" }}>
        <button
          type="button"
          className={`${styles.tabBtn} ${tab === "people" ? styles.tabActive : ""}`}
          onClick={() => setTab("people")}
        >
          01 Topluluğun İnsanları (Kişiler & Bölümler)
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${tab === "places" ? styles.tabActive : ""}`}
          onClick={() => setTab("places")}
        >
          02 Mekanlar & Buluşma Alanları (Places)
        </button>
      </div>

      {tab === "people" ? <PeopleEditor /> : <PlacesEditor />}
    </div>
  );
}
