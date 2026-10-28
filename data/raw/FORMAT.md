# Raw research file format (one JSON file per university / topic)

{
  "university": {
    "slug": "kebab-case", "nameFr": "", "nameAr": "", "nameEn": "", "city": "",
    "website": "", "facebook": "", "otherLinks": [""], "sources": [""]
  },
  "institutes": [
    {
      "slug": "kebab-case e.g. isam-mahdia", "shortName": "", "nameFr": "", "nameAr": "",
      "type": "faculte|ecole|institut|iset|other", "city": "", "governorate": "",
      "website": "", "facebook": "", "instagram": "", "otherLinks": [""],
      "newsPage": "URL where official announcements/avis are posted",
      "moodleOrElearning": "", "studentSpace": "",
      "programs": [
        { "nameFr": "", "degree": "licence|master|engineering|prep|doctorat|medicine|other",
          "kind": "fondamentale|appliquee|co-construite|recherche|professionnel|null",
          "officialCode": "orientation code if known", "durationYears": 3, "source": "" }
      ],
      "studentGroups": [ { "name": "", "url": "", "platform": "facebook|telegram|discord|other", "public": true } ],
      "examArchives": [ { "description": "", "url": "" } ],
      "equipmentNotes": "what students of this field need (tools, materials, attire, software), with source",
      "notes": "", "sources": [""], "confidence": "high|medium|low"
    }
  ],
  "calendars": [ { "title": "", "academicYear": "2026-2027", "url": "", "summary": "" } ],
  "gaps": ["what you could not find"]
}
