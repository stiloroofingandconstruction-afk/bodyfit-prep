import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Field';
import { addDays, today } from '@/lib/date';
import { useCurrentWeight } from '@/store/selectors';
import { useUnits } from '@/lib/useUnits';
import { usePrepStore } from '@/store/prepStore';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from '@/store/uiStore';
import type { CompetitionPrep, Division, Federation, PrepStatus } from '@/domain/competition';

const FEDERATIONS: Federation[] = [
  'IFBB Pro', 'IFBB', 'NPC', 'OCB', 'WNBF', 'INBA/PNBA', 'NANBF', 'Musclemania', 'Otra',
];

const DIVISIONS: Division[] = [
  "Men's Physique", 'Classic Physique', 'Bodybuilding',
  'Bikini', 'Wellness', 'Figure', 'Womens Physique', 'Otra',
];

const STATUSES: PrepStatus[] = ['planificado', 'activo', 'pausado', 'completado', 'cancelado'];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Prep existente a editar; si falta, se crea uno nuevo. */
  existing?: CompetitionPrep | null;
}

export function PrepSetupSheet({ open, onClose, existing }: Props) {
  const createPrep = usePrepStore((s) => s.createPrep);
  const updatePrep = usePrepStore((s) => s.updatePrep);
  const setCompetitionMode = useSettingsStore((s) => s.update);
  const currentWeight = useCurrentWeight();
  const u = useUnits();

  const [showName, setShowName] = useState('');
  const [federation, setFederation] = useState<Federation>('NPC');
  const [division, setDivision] = useState<Division>("Men's Physique");
  const [category, setCategory] = useState('');
  const [showDate, setShowDate] = useState(addDays(today(), 112)); // 16 semanas por defecto
  const [prepStartDate, setPrepStartDate] = useState(today());
  const [startWeight, setStartWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [startBf, setStartBf] = useState('');
  const [targetBf, setTargetBf] = useState('');
  const [coach, setCoach] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<PrepStatus>('activo');

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setShowName(existing.showName);
      setFederation(existing.federation);
      setDivision(existing.division);
      setCategory(existing.category);
      setShowDate(existing.showDate);
      setPrepStartDate(existing.prepStartDate);
      setStartWeight(u.numWeight(existing.startWeight));
      setTargetWeight(existing.targetWeight ? u.numWeight(existing.targetWeight) : '');
      setStartBf(existing.startBodyFat ? String(existing.startBodyFat) : '');
      setTargetBf(existing.targetBodyFat ? String(existing.targetBodyFat) : '');
      setCoach(existing.coach ?? '');
      setNotes(existing.notes ?? '');
      setStatus(existing.status);
    } else {
      setStartWeight(u.numWeight(currentWeight));
    }
  }, [open, existing, currentWeight, u]);

  const valid = showName.trim().length >= 2 && showDate > prepStartDate && Number(startWeight) > 0;

  const save = () => {
    const payload = {
      showName: showName.trim(),
      federation,
      division,
      category: category.trim(),
      showDate,
      prepStartDate,
      startWeight: u.toCanonicalWeight(Number(startWeight)),
      ...(targetWeight ? { targetWeight: u.toCanonicalWeight(Number(targetWeight)) } : {}),
      ...(startBf ? { startBodyFat: Number(startBf) } : {}),
      ...(targetBf ? { targetBodyFat: Number(targetBf) } : {}),
      ...(coach.trim() ? { coach: coach.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      status,
    };

    if (existing) {
      updatePrep(existing.id, payload);
      toast('Competencia actualizada');
    } else {
      createPrep(payload);
      setCompetitionMode({ competitionMode: true, division });
      toast('Modo competencia activado');
    }
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={existing ? 'Editar competencia' : 'Nueva competencia'}
      height="full"
      footer={
        <Button variant="primary" size="lg" block disabled={!valid} onClick={save}>
          {existing ? 'Guardar cambios' : 'Activar modo competencia'}
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Nombre del show</Label>
          <Input
            value={showName}
            onChange={(e) => setShowName(e.target.value)}
            placeholder="Campeonato regional 2026"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Federacion</Label>
            <Select value={federation} onChange={(e) => setFederation(e.target.value as Federation)}>
              {FEDERATIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Division</Label>
            <Select value={division} onChange={(e) => setDivision(e.target.value as Division)}>
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label hint="altura, edad, peso...">Categoria</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Open hasta 176 cm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Inicio del prep</Label>
            <Input type="date" value={prepStartDate} onChange={(e) => setPrepStartDate(e.target.value)} />
          </div>
          <div>
            <Label>Fecha del show</Label>
            <Input type="date" value={showDate} onChange={(e) => setShowDate(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Peso inicial</Label>
            <Input
              inputMode="decimal"
              value={startWeight}
              onChange={(e) => setStartWeight(e.target.value)}
              suffix={u.w}
            />
          </div>
          <div>
            <Label hint="estimado">Peso objetivo</Label>
            <Input
              inputMode="decimal"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              suffix={u.w}
              placeholder="—"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label hint="opcional">Grasa inicial</Label>
            <Input
              inputMode="decimal"
              value={startBf}
              onChange={(e) => setStartBf(e.target.value)}
              suffix="%"
              placeholder="—"
            />
          </div>
          <div>
            <Label hint="estimada">Grasa objetivo</Label>
            <Input
              inputMode="decimal"
              value={targetBf}
              onChange={(e) => setTargetBf(e.target.value)}
              suffix="%"
              placeholder="—"
            />
          </div>
        </div>

        <div>
          <Label hint="opcional">Entrenador</Label>
          <Input value={coach} onChange={(e) => setCoach(e.target.value)} placeholder="Nombre del coach" />
        </div>

        <div>
          <Label>Estado del prep</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as PrepStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label hint="opcional">Notas</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Objetivos, referencias, recordatorios..."
            className="w-full resize-none rounded-2xl border border-line bg-surface2 px-3.5 py-3 text-[15px] outline-none placeholder:text-faint focus:border-brand/60"
          />
        </div>

        <p className="rounded-2xl border border-line bg-surface2 p-3 text-[12px] text-faint">
          Los pesos y porcentajes objetivo son estimaciones para orientar el ritmo. La app no
          diagnostica ni prescribe: usalos junto al criterio de tu entrenador.
        </p>
      </div>
    </Sheet>
  );
}
