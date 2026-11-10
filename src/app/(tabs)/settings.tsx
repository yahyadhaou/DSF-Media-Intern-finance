import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { exportBackupFile, pickBackupFile } from '../../data/backupFiles';
import { useBackup, useCompany, useSaveCompany } from '../../data/hooks';
import type { BackupFile } from '../../data/ports';
import { DEFAULT_PLATFORM_FEE_RATE } from '../../domain/constants';
import type { CompanySettings } from '../../domain/types';
import { useAutosave } from '../../features/useAutosave';
import { Button } from '../../ui/Button';
import { SwitchRow } from '../../ui/Controls';
import { confirm, errorMessage, notify } from '../../ui/dialogs';
import { MoneyField, TextField } from '../../ui/Field';
import { Card, Header, Notice, Screen, SectionTitle } from '../../ui/Layout';
import { colors, font, space } from '../../ui/theme';

type PrintKey = 'printVatId' | 'printTaxNumber' | 'printCommercialRegister';
/** Settings keys that hold plain text. */
type TextKey = { [K in keyof CompanySettings]: CompanySettings[K] extends string ? K : never }[keyof CompanySettings];

function SettingsForm({ initial }: { initial: CompanySettings }) {
  const saveCompany = useSaveCompany();
  const backup = useBackup();
  const [company, setCompany] = useState(initial);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const { state } = useAutosave(company, saveCompany, { enabled: true, delay: 600 });

  const set = useCallback(<K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => setCompany((current) => ({ ...current, [key]: value })), []);
  const text = (key: TextKey) => ({
    value: company[key],
    onChangeText: (value: string) => set(key, value),
  });
  const taxField = (key: 'vatId' | 'taxNumber' | 'commercialRegister', print: PrintKey, label: string) => (
    <View style={{ gap: 2 }}>
      <TextField label={label} autoCapitalize="characters" {...text(key)} />
      <SwitchRow title="Auf Rechnung drucken" value={company[print]} onChange={(value) => set(print, value)} />
    </View>
  );

  const doExport = async () => {
    if (!backup) return;
    setBusy('export');
    try {
      await exportBackupFile(await backup.exportAll());
    } catch (error) {
      notify('Sicherung nicht möglich', errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const doImport = async () => {
    if (!backup) return;
    setBusy('import');
    try {
      const file = await pickBackupFile();
      if (!file) return;
      const ok = await confirm({
        title: 'Sicherung einspielen?',
        message: 'Alle Rechnungen, Fahrten, Preise und Einstellungen auf diesem Gerät werden durch die Sicherung ersetzt.',
        confirmLabel: 'Ersetzen',
        destructive: true,
      });
      if (!ok) return;
      await backup.importAll(file as BackupFile);
      notify('Fertig', 'Die Sicherung wurde eingespielt.');
    } catch (error) {
      notify('Einspielen nicht möglich', errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Einstellungen" subtitle={state === 'saving' ? 'Speichert …' : state === 'saved' ? 'Gespeichert ✓' : 'Speichert automatisch'} />
      <Screen>
        <SectionTitle>Firma</SectionTitle>
        <Card>
          <TextField label="Firmenname" autoCapitalize="words" {...text('name')} />
          <TextField label="Straße und Hausnummer" {...text('street')} />
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <TextField style={{ flex: 1 }} label="PLZ" keyboardType="number-pad" maxLength={5} {...text('zip')} />
            <TextField style={{ flex: 2 }} label="Ort" autoCapitalize="words" {...text('city')} />
          </View>
          <TextField label="Telefon" keyboardType="phone-pad" autoComplete="tel" {...text('phone')} />
          <TextField label="E-Mail" keyboardType="email-address" autoCapitalize="none" autoComplete="email" {...text('email')} />
          <TextField label="Webseite" keyboardType="url" autoCapitalize="none" {...text('website')} />
          <TextField label="Geschäftsführer" autoCapitalize="words" {...text('managingDirector')} />
        </Card>

        <SectionTitle>Steuer & Register</SectionTitle>
        <Card>
          <Text style={font.small}>Diese Angaben stehen nur im PDF, wenn der Schalter darunter eingeschaltet ist.</Text>
          {taxField('vatId', 'printVatId', 'USt-IdNr.')}
          {taxField('taxNumber', 'printTaxNumber', 'Steuernummer')}
          {taxField('commercialRegister', 'printCommercialRegister', 'Handelsregister')}
        </Card>

        <SectionTitle>Bankverbindung</SectionTitle>
        <Card>
          <TextField label="IBAN" autoCapitalize="characters" {...text('iban')} />
          <TextField label="BIC" autoCapitalize="characters" {...text('bic')} />
          <TextField label="Bankleitzahl" keyboardType="number-pad" {...text('bankCode')} />
          <TextField label="Kontonummer" keyboardType="number-pad" {...text('accountNumber')} />
        </Card>

        <SectionTitle>Standard für neue Rechnungen</SectionTitle>
        <Card>
          <SwitchRow title="Preise enthalten USt." description="Die Preisliste ist Brutto." value={company.pricesIncludeVat} onChange={(value) => set('pricesIncludeVat', value)} />
          <SwitchRow title="19 % USt. ausweisen" value={company.chargeVatDefault} onChange={(value) => set('chargeVatDefault', value)} />
          <SwitchRow title="Bankverbindung drucken" value={company.printBankDetails} onChange={(value) => set('printBankDetails', value)} />
          <MoneyField label="Ka-sys Platform pro Tag (netto)" value={company.platformFeeDailyRate} onChange={(value) => set('platformFeeDailyRate', value || DEFAULT_PLATFORM_FEE_RATE)} />
          <MoneyField label="Fahrtkosten pro Kilometer" value={company.travelRatePerKm} onChange={(value) => set('travelRatePerKm', value)} />
        </Card>

        {backup ? (
          <>
            <SectionTitle>Sicherung</SectionTitle>
            <Card>
              <Text style={font.small}>Alle Daten liegen nur auf diesem Gerät. Speichere regelmäßig eine Sicherung, z. B. in iCloud, Google Drive oder per E-Mail. Die Datei passt auch zur Web-App.</Text>
              <Button label="Sicherung speichern" icon="cloud-upload-outline" loading={busy === 'export'} onPress={() => void doExport()} block />
              <Button label="Sicherung einspielen" icon="cloud-download-outline" variant="secondary" loading={busy === 'import'} onPress={() => void doImport()} block />
            </Card>
          </>
        ) : null}

        <Notice tone="teal">DSF Media Rechnungs-App · Version 1.0</Notice>
      </Screen>
    </View>
  );
}

export default function SettingsScreen() {
  const { data } = useCompany();
  if (!data) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return <SettingsForm initial={data} />;
}
