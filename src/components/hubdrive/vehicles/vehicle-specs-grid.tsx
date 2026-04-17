import { Vehicle } from '@prisma/client';

interface VehicleSpecsGridProps {
    vehicle: {
        year: number;
        bodyType: string;
        engineType: string;
        drivetrain: string;
        powerHp?: number | null;
        engineVolume?: number | null;
    };
}

export function VehicleSpecsGrid({ vehicle }: VehicleSpecsGridProps) {
    return (
        <section className="px-6 py-6 mt-4 border-t border-surface-container">
            <h3 className="font-headline font-bold text-xl mb-6 text-on-surface">Характеристики</h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <SpecItem label="Кузов" value={vehicle.bodyType} />
                <SpecItem label="Год выпуска" value={`${vehicle.year} г.`} />
                <SpecItem label="Двигатель" value={vehicle.engineType} />
                <SpecItem label="Привод" value={vehicle.drivetrain} />
                {vehicle.powerHp && (
                    <SpecItem label="Мощность" value={`${vehicle.powerHp} л.с.`} />
                )}
                {vehicle.engineVolume && (
                    <SpecItem label="Объем" value={`${vehicle.engineVolume} л.`} />
                )}
            </div>
        </section>
    );
}

function SpecItem({ label, value }: { label: string; value: string | number }) {
    return (
        <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">{label}</p>
            <p className="font-medium text-on-surface font-body">{value}</p>
        </div>
    );
}
