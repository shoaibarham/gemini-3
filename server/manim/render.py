#!/usr/bin/env python3
"""
Manim Math Visualization Renderer
Generates beautiful animated explanations for math problems.
Usage: python3 render.py '{"type":"addition","operand1":3,"operand2":4,"answer":7}'
"""
import sys
import json
import hashlib
import os

os.environ["MANIM_RENDERER"] = "cairo"

from manim import *

CHILD_COLORS = {
    "blue": "#4F8CF7",
    "green": "#34D399",
    "orange": "#FB923C",
    "pink": "#F472B6",
    "purple": "#A78BFA",
    "yellow": "#FBBF24",
    "red": "#F87171",
    "teal": "#2DD4BF",
}

BG_COLOR = "#1a1b26"
TEXT_COLOR = "#e1e2e7"
ACCENT_1 = CHILD_COLORS["blue"]
ACCENT_2 = CHILD_COLORS["green"]
ACCENT_3 = CHILD_COLORS["orange"]
ACCENT_4 = CHILD_COLORS["purple"]


class AdditionScene(Scene):
    def __init__(self, operand1, operand2, answer, **kwargs):
        super().__init__(**kwargs)
        self.op1 = operand1
        self.op2 = operand2
        self.ans = answer

    def construct(self):
        self.camera.background_color = BG_COLOR

        title = Text("Addition", font_size=40, color=ACCENT_1, font="sans-serif", weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=0.5)

        equation = VGroup(
            Text(str(self.op1), font_size=56, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("+", font_size=48, color=ACCENT_1, font="sans-serif", weight=BOLD),
            Text(str(self.op2), font_size=56, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("=", font_size=48, color=TEXT_COLOR, font="sans-serif"),
            Text("?", font_size=56, color=ACCENT_3, font="sans-serif", weight=BOLD),
        ).arrange(RIGHT, buff=0.4)
        equation.next_to(title, DOWN, buff=0.6)
        self.play(FadeIn(equation, shift=UP * 0.3), run_time=0.5)

        cap1 = min(self.op1, 12)
        cap2 = min(self.op2, 12)

        dots_left = VGroup()
        for i in range(cap1):
            dot = Circle(radius=0.18, fill_opacity=1, color=ACCENT_1, stroke_width=0)
            dots_left.add(dot)
        dots_left.arrange_in_grid(rows=max(1, (cap1 + 3) // 4), cols=min(cap1, 4), buff=0.15)

        dots_right = VGroup()
        for i in range(cap2):
            dot = Circle(radius=0.18, fill_opacity=1, color=ACCENT_2, stroke_width=0)
            dots_right.add(dot)
        dots_right.arrange_in_grid(rows=max(1, (cap2 + 3) // 4), cols=min(cap2, 4), buff=0.15)

        all_dots = VGroup(dots_left, dots_right).arrange(RIGHT, buff=1.2)
        all_dots.move_to(ORIGIN + DOWN * 0.3)

        if cap1 > 0 and cap2 > 0:
            sep_line = DashedLine(
                start=dots_left.get_right() + RIGHT * 0.3 + UP * 1,
                end=dots_left.get_right() + RIGHT * 0.3 + DOWN * 1,
                color=ACCENT_3, dash_length=0.1, stroke_width=2
            )

        label_left = Text(str(self.op1), font_size=32, color=ACCENT_1, font="sans-serif", weight=BOLD)
        label_left.next_to(dots_left, DOWN, buff=0.3)
        label_right = Text(str(self.op2), font_size=32, color=ACCENT_2, font="sans-serif", weight=BOLD)
        label_right.next_to(dots_right, DOWN, buff=0.3)

        self.play(
            LaggedStart(*[GrowFromCenter(d) for d in dots_left], lag_ratio=0.08),
            FadeIn(label_left, shift=UP * 0.2),
            run_time=0.8,
        )
        if cap1 > 0 and cap2 > 0:
            self.play(Create(sep_line), run_time=0.3)
        self.play(
            LaggedStart(*[GrowFromCenter(d) for d in dots_right], lag_ratio=0.08),
            FadeIn(label_right, shift=UP * 0.2),
            run_time=0.8,
        )

        self.wait(0.3)

        if cap1 > 0 and cap2 > 0:
            self.play(FadeOut(sep_line), run_time=0.3)

        combined = VGroup(*dots_left, *dots_right)
        target_grid = VGroup()
        for i, dot in enumerate(combined):
            new_dot = dot.copy()
            target_grid.add(new_dot)
        target_grid.arrange_in_grid(
            rows=max(1, (cap1 + cap2 + 5) // 6),
            cols=min(cap1 + cap2, 6),
            buff=0.15
        )
        target_grid.move_to(ORIGIN + DOWN * 0.3)

        anims = []
        for orig, target in zip(combined, target_grid):
            anims.append(orig.animate.move_to(target.get_center()))
        self.play(
            *anims,
            FadeOut(label_left),
            FadeOut(label_right),
            run_time=0.8,
        )

        answer_text = Text(str(self.ans), font_size=56, color=ACCENT_2, font="sans-serif", weight=BOLD)
        equation_final = VGroup(
            Text(str(self.op1), font_size=56, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("+", font_size=48, color=ACCENT_1, font="sans-serif", weight=BOLD),
            Text(str(self.op2), font_size=56, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("=", font_size=48, color=TEXT_COLOR, font="sans-serif"),
            answer_text,
        ).arrange(RIGHT, buff=0.4)
        equation_final.move_to(equation.get_center())

        self.play(
            Transform(equation, equation_final),
            run_time=0.6,
        )

        answer_label = Text(str(self.ans), font_size=36, color=ACCENT_2, font="sans-serif", weight=BOLD)
        answer_label.next_to(combined, DOWN, buff=0.3)
        self.play(FadeIn(answer_label, shift=UP * 0.2), run_time=0.4)

        box = SurroundingRectangle(answer_text, color=ACCENT_2, buff=0.15, corner_radius=0.1, stroke_width=3)
        self.play(Create(box), run_time=0.4)

        sparkles = VGroup()
        for _ in range(8):
            s = Star(n=5, outer_radius=0.1, inner_radius=0.04, color=CHILD_COLORS["yellow"], fill_opacity=1, stroke_width=0)
            angle = np.random.uniform(0, 2 * PI)
            dist = np.random.uniform(0.5, 1.2)
            s.move_to(answer_text.get_center() + np.array([np.cos(angle) * dist, np.sin(angle) * dist, 0]))
            sparkles.add(s)
        self.play(LaggedStart(*[FadeIn(s, scale=0.3) for s in sparkles], lag_ratio=0.05), run_time=0.5)
        self.play(LaggedStart(*[FadeOut(s, scale=2) for s in sparkles], lag_ratio=0.05), run_time=0.5)

        self.wait(0.5)


class SubtractionScene(Scene):
    def __init__(self, operand1, operand2, answer, **kwargs):
        super().__init__(**kwargs)
        self.op1 = operand1
        self.op2 = operand2
        self.ans = answer

    def construct(self):
        self.camera.background_color = BG_COLOR

        title = Text("Subtraction", font_size=40, color=ACCENT_3, font="sans-serif", weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=0.5)

        equation = VGroup(
            Text(str(self.op1), font_size=56, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("-", font_size=48, color=ACCENT_3, font="sans-serif", weight=BOLD),
            Text(str(self.op2), font_size=56, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("=", font_size=48, color=TEXT_COLOR, font="sans-serif"),
            Text("?", font_size=56, color=ACCENT_3, font="sans-serif", weight=BOLD),
        ).arrange(RIGHT, buff=0.4)
        equation.next_to(title, DOWN, buff=0.6)
        self.play(FadeIn(equation, shift=UP * 0.3), run_time=0.5)

        cap_total = min(self.op1, 15)
        cap_remove = min(self.op2, cap_total)

        dots = VGroup()
        for i in range(cap_total):
            dot = Circle(radius=0.18, fill_opacity=1, color=ACCENT_1, stroke_width=0)
            dots.add(dot)
        dots.arrange_in_grid(rows=max(1, (cap_total + 4) // 5), cols=min(cap_total, 5), buff=0.15)
        dots.move_to(ORIGIN + DOWN * 0.3)

        count_label = Text(str(self.op1), font_size=32, color=ACCENT_1, font="sans-serif", weight=BOLD)
        count_label.next_to(dots, DOWN, buff=0.3)

        self.play(
            LaggedStart(*[GrowFromCenter(d) for d in dots], lag_ratio=0.06),
            FadeIn(count_label),
            run_time=0.8,
        )
        self.wait(0.3)

        remove_label = Text(f"Take away {self.op2}", font_size=28, color=ACCENT_3, font="sans-serif")
        remove_label.next_to(dots, UP, buff=0.3)
        self.play(FadeIn(remove_label, shift=DOWN * 0.2), run_time=0.4)

        dots_to_remove = dots[-cap_remove:]
        cross_marks = VGroup()
        for dot in dots_to_remove:
            cross = Cross(dot, stroke_color=CHILD_COLORS["red"], stroke_width=3)
            cross.scale(0.7)
            cross_marks.add(cross)

        self.play(
            LaggedStart(*[Create(c) for c in cross_marks], lag_ratio=0.08),
            run_time=0.6,
        )
        self.wait(0.3)

        self.play(
            LaggedStart(
                *[FadeOut(VGroup(d, c), shift=UP * 0.5 + RIGHT * 0.3, scale=0.3) for d, c in zip(dots_to_remove, cross_marks)],
                lag_ratio=0.06,
            ),
            FadeOut(remove_label),
            FadeOut(count_label),
            run_time=0.8,
        )

        remaining = VGroup(*dots[:cap_total - cap_remove])
        for d in remaining:
            d.set_color(ACCENT_2)
        remaining_target = remaining.copy()
        remaining_target.arrange_in_grid(
            rows=max(1, (cap_total - cap_remove + 4) // 5),
            cols=min(max(cap_total - cap_remove, 1), 5),
            buff=0.15
        )
        remaining_target.move_to(ORIGIN + DOWN * 0.3)

        anims = []
        for orig, targ in zip(remaining, remaining_target):
            anims.append(orig.animate.move_to(targ.get_center()).set_color(ACCENT_2))
        if anims:
            self.play(*anims, run_time=0.6)

        answer_text = Text(str(self.ans), font_size=56, color=ACCENT_2, font="sans-serif", weight=BOLD)
        equation_final = VGroup(
            Text(str(self.op1), font_size=56, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("-", font_size=48, color=ACCENT_3, font="sans-serif", weight=BOLD),
            Text(str(self.op2), font_size=56, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("=", font_size=48, color=TEXT_COLOR, font="sans-serif"),
            answer_text,
        ).arrange(RIGHT, buff=0.4)
        equation_final.move_to(equation.get_center())

        self.play(Transform(equation, equation_final), run_time=0.6)

        result_label = Text(str(self.ans), font_size=36, color=ACCENT_2, font="sans-serif", weight=BOLD)
        result_label.next_to(remaining, DOWN, buff=0.3)
        self.play(FadeIn(result_label, shift=UP * 0.2), run_time=0.4)

        box = SurroundingRectangle(answer_text, color=ACCENT_2, buff=0.15, corner_radius=0.1, stroke_width=3)
        self.play(Create(box), run_time=0.4)
        self.wait(0.5)


class MultiplicationScene(Scene):
    def __init__(self, operand1, operand2, answer, **kwargs):
        super().__init__(**kwargs)
        self.op1 = operand1
        self.op2 = operand2
        self.ans = answer

    def construct(self):
        self.camera.background_color = BG_COLOR

        title = Text("Multiplication", font_size=40, color=ACCENT_4, font="sans-serif", weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=0.5)

        equation = VGroup(
            Text(str(self.op1), font_size=56, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("\u00d7", font_size=48, color=ACCENT_4, font="sans-serif", weight=BOLD),
            Text(str(self.op2), font_size=56, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("=", font_size=48, color=TEXT_COLOR, font="sans-serif"),
            Text("?", font_size=56, color=ACCENT_3, font="sans-serif", weight=BOLD),
        ).arrange(RIGHT, buff=0.4)
        equation.next_to(title, DOWN, buff=0.6)
        self.play(FadeIn(equation, shift=UP * 0.3), run_time=0.5)

        group_desc = Text(
            f"{self.op2} groups of {self.op1}",
            font_size=28, color=ACCENT_4, font="sans-serif"
        )
        group_desc.next_to(equation, DOWN, buff=0.4)
        self.play(FadeIn(group_desc, shift=UP * 0.2), run_time=0.4)

        colors = [ACCENT_1, ACCENT_2, ACCENT_3, ACCENT_4,
                  CHILD_COLORS["pink"], CHILD_COLORS["teal"],
                  CHILD_COLORS["yellow"], CHILD_COLORS["red"]]

        cap_groups = min(self.op2, 6)
        cap_per = min(self.op1, 6)

        groups = VGroup()
        for g in range(cap_groups):
            group = VGroup()
            col = colors[g % len(colors)]
            for i in range(cap_per):
                dot = Circle(radius=0.14, fill_opacity=1, color=col, stroke_width=0)
                group.add(dot)
            group.arrange_in_grid(
                rows=max(1, (cap_per + 2) // 3),
                cols=min(cap_per, 3),
                buff=0.1
            )

            border = SurroundingRectangle(group, color=col, buff=0.15, corner_radius=0.08, stroke_width=2)
            label = Text(str(self.op1), font_size=20, color=col, font="sans-serif", weight=BOLD)
            label.next_to(border, DOWN, buff=0.1)
            groups.add(VGroup(group, border, label))

        groups.arrange_in_grid(
            rows=max(1, (cap_groups + 2) // 3),
            cols=min(cap_groups, 3),
            buff=0.5
        )
        groups.move_to(ORIGIN + DOWN * 0.5)
        groups.scale_to_fit_width(min(groups.get_width(), 10))

        for g_idx, grp in enumerate(groups):
            dots_in_group = grp[0]
            border = grp[1]
            label = grp[2]
            self.play(
                LaggedStart(*[GrowFromCenter(d) for d in dots_in_group], lag_ratio=0.05),
                Create(border),
                FadeIn(label),
                run_time=0.5,
            )

        self.wait(0.3)
        self.play(FadeOut(group_desc), run_time=0.3)

        answer_text = Text(str(self.ans), font_size=56, color=ACCENT_2, font="sans-serif", weight=BOLD)
        equation_final = VGroup(
            Text(str(self.op1), font_size=56, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("\u00d7", font_size=48, color=ACCENT_4, font="sans-serif", weight=BOLD),
            Text(str(self.op2), font_size=56, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("=", font_size=48, color=TEXT_COLOR, font="sans-serif"),
            answer_text,
        ).arrange(RIGHT, buff=0.4)
        equation_final.move_to(equation.get_center())

        self.play(Transform(equation, equation_final), run_time=0.6)

        box = SurroundingRectangle(answer_text, color=ACCENT_2, buff=0.15, corner_radius=0.1, stroke_width=3)
        self.play(Create(box), run_time=0.4)

        sparkles = VGroup()
        for _ in range(6):
            s = Star(n=5, outer_radius=0.1, inner_radius=0.04, color=CHILD_COLORS["yellow"], fill_opacity=1, stroke_width=0)
            angle = np.random.uniform(0, 2 * PI)
            dist = np.random.uniform(0.5, 1.0)
            s.move_to(answer_text.get_center() + np.array([np.cos(angle) * dist, np.sin(angle) * dist, 0]))
            sparkles.add(s)
        self.play(LaggedStart(*[FadeIn(s, scale=0.3) for s in sparkles], lag_ratio=0.05), run_time=0.4)
        self.play(LaggedStart(*[FadeOut(s, scale=2) for s in sparkles], lag_ratio=0.05), run_time=0.4)
        self.wait(0.3)


class DivisionScene(Scene):
    def __init__(self, operand1, operand2, answer, **kwargs):
        super().__init__(**kwargs)
        self.op1 = operand1
        self.op2 = operand2
        self.ans = answer

    def construct(self):
        self.camera.background_color = BG_COLOR

        title = Text("Division", font_size=40, color=CHILD_COLORS["teal"], font="sans-serif", weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=0.5)

        equation = VGroup(
            Text(str(self.op1), font_size=56, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("\u00f7", font_size=48, color=CHILD_COLORS["teal"], font="sans-serif", weight=BOLD),
            Text(str(self.op2), font_size=56, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("=", font_size=48, color=TEXT_COLOR, font="sans-serif"),
            Text("?", font_size=56, color=ACCENT_3, font="sans-serif", weight=BOLD),
        ).arrange(RIGHT, buff=0.4)
        equation.next_to(title, DOWN, buff=0.6)
        self.play(FadeIn(equation, shift=UP * 0.3), run_time=0.5)

        cap_total = min(self.op1, 20)
        cap_groups = min(self.op2, 6)
        cap_per = min(self.ans, 6)

        all_dots = VGroup()
        for i in range(cap_total):
            dot = Circle(radius=0.14, fill_opacity=1, color=ACCENT_1, stroke_width=0)
            all_dots.add(dot)
        all_dots.arrange_in_grid(
            rows=max(1, (cap_total + 5) // 6),
            cols=min(cap_total, 6),
            buff=0.12
        )
        all_dots.move_to(ORIGIN + DOWN * 0.3)

        count_label = Text(
            f"{self.op1} items total",
            font_size=28, color=ACCENT_1, font="sans-serif"
        )
        count_label.next_to(all_dots, DOWN, buff=0.3)

        self.play(
            LaggedStart(*[GrowFromCenter(d) for d in all_dots], lag_ratio=0.04),
            FadeIn(count_label),
            run_time=0.8,
        )
        self.wait(0.3)

        split_label = Text(
            f"Split into {self.op2} equal groups",
            font_size=28, color=CHILD_COLORS["teal"], font="sans-serif"
        )
        split_label.next_to(all_dots, UP, buff=0.3)
        self.play(
            FadeIn(split_label, shift=DOWN * 0.2),
            FadeOut(count_label),
            run_time=0.4,
        )
        self.wait(0.3)

        colors = [ACCENT_1, ACCENT_2, ACCENT_3, ACCENT_4,
                  CHILD_COLORS["pink"], CHILD_COLORS["teal"]]

        groups = VGroup()
        for g in range(cap_groups):
            group = VGroup()
            col = colors[g % len(colors)]
            for i in range(cap_per):
                dot = Circle(radius=0.14, fill_opacity=1, color=col, stroke_width=0)
                group.add(dot)
            group.arrange_in_grid(
                rows=max(1, (cap_per + 2) // 3),
                cols=min(cap_per, 3),
                buff=0.1
            )
            border = SurroundingRectangle(group, color=col, buff=0.12, corner_radius=0.08, stroke_width=2)
            per_label = Text(str(self.ans), font_size=18, color=col, font="sans-serif", weight=BOLD)
            per_label.next_to(border, DOWN, buff=0.08)
            groups.add(VGroup(group, border, per_label))

        groups.arrange_in_grid(
            rows=max(1, (cap_groups + 2) // 3),
            cols=min(cap_groups, 3),
            buff=0.5
        )
        groups.move_to(ORIGIN + DOWN * 0.5)
        groups.scale_to_fit_width(min(groups.get_width(), 10))

        move_anims = []
        dot_idx = 0
        for grp in groups:
            dots_in_group = grp[0]
            for target_dot in dots_in_group:
                if dot_idx < len(all_dots):
                    move_anims.append(all_dots[dot_idx].animate.move_to(target_dot.get_center()).set_color(target_dot.get_color()))
                    dot_idx += 1

        self.play(
            *move_anims,
            FadeOut(split_label),
            run_time=1.0,
        )

        border_anims = []
        for grp in groups:
            border_anims.append(Create(grp[1]))
            border_anims.append(FadeIn(grp[2]))
        self.play(*border_anims, run_time=0.5)

        answer_text = Text(str(self.ans), font_size=56, color=ACCENT_2, font="sans-serif", weight=BOLD)
        equation_final = VGroup(
            Text(str(self.op1), font_size=56, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("\u00f7", font_size=48, color=CHILD_COLORS["teal"], font="sans-serif", weight=BOLD),
            Text(str(self.op2), font_size=56, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("=", font_size=48, color=TEXT_COLOR, font="sans-serif"),
            answer_text,
        ).arrange(RIGHT, buff=0.4)
        equation_final.move_to(equation.get_center())

        self.play(Transform(equation, equation_final), run_time=0.6)

        each_label = Text(
            f"{self.ans} in each group!",
            font_size=28, color=ACCENT_2, font="sans-serif", weight=BOLD
        )
        each_label.next_to(groups, DOWN, buff=0.3)
        self.play(FadeIn(each_label, shift=UP * 0.2), run_time=0.4)

        box = SurroundingRectangle(answer_text, color=ACCENT_2, buff=0.15, corner_radius=0.1, stroke_width=3)
        self.play(Create(box), run_time=0.4)
        self.wait(0.5)


class NumberLineScene(Scene):
    def __init__(self, operand1, operand2, answer, op_type, **kwargs):
        super().__init__(**kwargs)
        self.op1 = operand1
        self.op2 = operand2
        self.ans = answer
        self.op_type = op_type

    def construct(self):
        self.camera.background_color = BG_COLOR

        title_text = "Number Line"
        title_color = ACCENT_1 if self.op_type == "addition" else ACCENT_3
        title = Text(title_text, font_size=40, color=title_color, font="sans-serif", weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=0.5)

        op_sym = "+" if self.op_type == "addition" else "-"
        equation = VGroup(
            Text(str(self.op1), font_size=48, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text(op_sym, font_size=40, color=title_color, font="sans-serif", weight=BOLD),
            Text(str(self.op2), font_size=48, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("=", font_size=40, color=TEXT_COLOR, font="sans-serif"),
            Text("?", font_size=48, color=ACCENT_3, font="sans-serif", weight=BOLD),
        ).arrange(RIGHT, buff=0.4)
        equation.next_to(title, DOWN, buff=0.5)
        self.play(FadeIn(equation, shift=UP * 0.3), run_time=0.5)

        line_min = 0
        line_max = max(self.op1, self.ans) + 2
        line_max = min(line_max, 25)

        num_line = NumberLine(
            x_range=[line_min, line_max, 1],
            length=10,
            color=TEXT_COLOR,
            include_numbers=True,
            label_direction=DOWN,
            font_size=22,
            tick_size=0.1,
            numbers_to_include=range(line_min, line_max + 1),
        )
        num_line.move_to(ORIGIN + DOWN * 0.5)
        self.play(Create(num_line), run_time=0.6)

        start_dot = Dot(num_line.n2p(self.op1), color=ACCENT_1, radius=0.12)
        start_label = Text(str(self.op1), font_size=24, color=ACCENT_1, font="sans-serif", weight=BOLD)
        start_label.next_to(start_dot, UP, buff=0.2)
        self.play(GrowFromCenter(start_dot), FadeIn(start_label), run_time=0.4)

        direction = 1 if self.op_type == "addition" else -1
        jump_color = ACCENT_2 if self.op_type == "addition" else ACCENT_3
        steps = min(self.op2, 10)

        for i in range(steps):
            current = self.op1 + direction * i
            next_val = self.op1 + direction * (i + 1)

            if next_val < line_min or next_val > line_max:
                break

            arc = ArcBetweenPoints(
                num_line.n2p(current),
                num_line.n2p(next_val),
                angle=-PI / 3 if direction > 0 else PI / 3,
                color=jump_color,
                stroke_width=2,
            )
            arc.shift(UP * 0.3)

            arrow_tip = Triangle(fill_opacity=1, color=jump_color, stroke_width=0)
            arrow_tip.scale(0.08)
            arrow_tip.move_to(arc.get_end())

            self.play(Create(arc), FadeIn(arrow_tip), run_time=0.15)

        end_dot = Dot(num_line.n2p(self.ans), color=ACCENT_2, radius=0.15)
        end_label = Text(str(self.ans), font_size=28, color=ACCENT_2, font="sans-serif", weight=BOLD)
        end_label.next_to(end_dot, UP, buff=0.3)

        self.play(
            GrowFromCenter(end_dot),
            FadeIn(end_label, shift=DOWN * 0.2),
            run_time=0.5,
        )

        answer_text = Text(str(self.ans), font_size=48, color=ACCENT_2, font="sans-serif", weight=BOLD)
        equation_final = VGroup(
            Text(str(self.op1), font_size=48, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text(op_sym, font_size=40, color=title_color, font="sans-serif", weight=BOLD),
            Text(str(self.op2), font_size=48, color=TEXT_COLOR, font="sans-serif", weight=BOLD),
            Text("=", font_size=40, color=TEXT_COLOR, font="sans-serif"),
            answer_text,
        ).arrange(RIGHT, buff=0.4)
        equation_final.move_to(equation.get_center())

        self.play(Transform(equation, equation_final), run_time=0.6)

        box = SurroundingRectangle(answer_text, color=ACCENT_2, buff=0.15, corner_radius=0.1, stroke_width=3)
        self.play(Create(box), run_time=0.4)
        self.wait(0.5)


SCENE_MAP = {
    "addition": AdditionScene,
    "subtraction": SubtractionScene,
    "multiplication": MultiplicationScene,
    "division": DivisionScene,
}


def get_cache_filename(data):
    key = f"{data['type']}_{data['operand1']}_{data['operand2']}_{data.get('style', 'default')}"
    hash_str = hashlib.md5(key.encode()).hexdigest()[:12]
    return f"math_viz_{hash_str}"


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No problem data provided"}))
        sys.exit(1)

    try:
        data = json.loads(sys.argv[1])
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON: {str(e)}"}))
        sys.exit(1)

    required = ["type", "operand1", "operand2", "answer"]
    for field in required:
        if field not in data:
            print(json.dumps({"error": f"Missing field: {field}"}))
            sys.exit(1)

    op_type = data["type"]
    op1 = int(data["operand1"])
    op2 = int(data["operand2"])
    answer = int(data["answer"])
    style = data.get("style", "default")

    cache_name = get_cache_filename(data)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    output_dir = os.path.join(project_root, "public", "manim-cache")
    os.makedirs(output_dir, exist_ok=True)

    output_file = os.path.join(output_dir, f"{cache_name}.mp4")
    if os.path.exists(output_file):
        print(json.dumps({
            "success": True,
            "videoUrl": f"/manim-cache/{cache_name}.mp4",
            "cached": True,
        }))
        return

    try:
        tempconfig_kwargs = {
            "pixel_height": 720,
            "pixel_width": 1280,
            "frame_rate": 30,
            "output_file": cache_name,
            "media_dir": os.path.join(output_dir, "media_tmp"),
            "quality": "medium_quality",
            "disable_caching": True,
            "preview": False,
        }

        with tempconfig(tempconfig_kwargs):
            if style == "numberline" and op_type in ("addition", "subtraction"):
                scene = NumberLineScene(op1, op2, answer, op_type)
            elif op_type in SCENE_MAP:
                scene = SCENE_MAP[op_type](op1, op2, answer)
            else:
                print(json.dumps({"error": f"Unknown type: {op_type}"}))
                sys.exit(1)

            scene.render()

        import shutil

        found_mp4 = None
        for root, dirs, files in os.walk(os.path.join(output_dir, "media_tmp")):
            for f in files:
                if f.endswith(".mp4") and "partial" not in root:
                    found_mp4 = os.path.join(root, f)
                    break
            if found_mp4:
                break

        if not found_mp4:
            for root, dirs, files in os.walk(os.path.join(output_dir, "media_tmp")):
                for f in files:
                    if f.endswith(".mp4"):
                        found_mp4 = os.path.join(root, f)
                        break
                if found_mp4:
                    break

        if not found_mp4:
            for root, dirs, files in os.walk("."):
                if "manim-cache" in root:
                    continue
                for f in files:
                    if f.endswith(".mp4") and cache_name in f:
                        found_mp4 = os.path.join(root, f)
                        break
                if found_mp4:
                    break

        if found_mp4:
            shutil.move(found_mp4, output_file)
            media_tmp = os.path.join(output_dir, "media_tmp")
            if os.path.exists(media_tmp):
                shutil.rmtree(media_tmp, ignore_errors=True)
            if os.path.exists("media"):
                shutil.rmtree("media", ignore_errors=True)

            print(json.dumps({
                "success": True,
                "videoUrl": f"/manim-cache/{cache_name}.mp4",
                "cached": False,
            }))
        else:
            print(json.dumps({"error": "Rendered file not found after rendering"}))
            sys.exit(1)

    except Exception as e:
        import traceback
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))
        sys.exit(1)


if __name__ == "__main__":
    main()
