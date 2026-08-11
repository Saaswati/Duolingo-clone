"use client";

import type { Course } from "@/lib/types";
import { SkillNode } from "./SkillNode";
import { useToast } from "./ui/Toast";

export function PathView({ course }: { course: Course }) {
  const toast = useToast();

  return (
    <div className="flex flex-col items-center pb-16">
      {course.units.map((unit, unitIndex) => {
        const positions = unit.skills.map((_, i) => {
          const direction = i % 2 === 0 ? 1 : -1;
          return Math.round(direction * 70);
        });

        return (
          <section key={unit.id} className="w-full">
            <UnitBanner unit={unit} unitIndex={unitIndex} />
            <div className="flex flex-col items-center gap-10 py-8">
              {unit.skills.map((skill, i) => (
                <SkillNode
                  key={skill.id}
                  skill={skill}
                  color={unit.color}
                  offset={positions[i]}
                  onLocked={() =>
                    toast("Complete the skill before this one first.", "info")
                  }
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function UnitBanner({
  unit,
  unitIndex,
}: {
  unit: Course["units"][number];
  unitIndex: number;
}) {
  const styles: Record<string, string> = {
    green: "bg-[#58CC02]",
    blue: "bg-[#1CB0F6]",
    purple: "bg-[#CE82FF]",
  };
  const bg = styles[unit.color] ?? styles.green;

  return (
    <div className={`sticky top-[72px] z-10 rounded-2xl ${bg} px-6 py-5 text-white shadow-lg`}>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] opacity-80">
        Unit {unitIndex + 1}
      </p>
      <p className="text-xl font-extrabold">{unit.subtitle}</p>
    </div>
  );
}
