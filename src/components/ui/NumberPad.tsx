import { Delete } from 'lucide-react';
import { cx, haptic } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (next: string) => void;
  allowDecimal?: boolean;
  maxLength?: number;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Teclado numerico propio.
 *
 * El teclado nativo de iOS empuja el layout, tarda en aparecer y obliga a
 * inputs de 16 px para no hacer zoom. Con uno propio la entrada de gramos es
 * instantanea y las teclas son grandes: se usa con el movil en la mano y
 * mancuernas al lado.
 */
export function NumberPad({ value, onChange, allowDecimal = false, maxLength = 5 }: Props) {
  const press = (key: string) => {
    haptic(6);
    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (!allowDecimal || value.includes('.')) return;
      onChange((value || '0') + '.');
      return;
    }
    if (value.length >= maxLength) return;
    if (value === '0') {
      onChange(key);
      return;
    }
    onChange(value + key);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((k) => (
        <Key key={k} onPress={() => press(k)}>
          {k}
        </Key>
      ))}
      <Key onPress={() => press(allowDecimal ? '.' : '0')} muted={!allowDecimal}>
        {allowDecimal ? ',' : '0'}
      </Key>
      <Key onPress={() => press('0')}>0</Key>
      <Key onPress={() => press('del')} muted>
        <Delete size={22} />
      </Key>
    </div>
  );
}

function Key({
  children,
  onPress,
  muted,
}: {
  children: React.ReactNode;
  onPress: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cx(
        'pressable flex h-14 items-center justify-center rounded-2xl text-[22px] font-medium tabular',
        muted ? 'bg-surface text-muted' : 'bg-surface2 text-ink',
      )}
    >
      {children}
    </button>
  );
}
