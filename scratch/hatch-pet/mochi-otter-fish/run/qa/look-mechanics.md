# Mochi Otter look mechanics

Mochi's seated lower body, feet, tail base, cream belly, and the center of the fish form the stable anchor. The eyes lead each gaze, followed by a small head yaw or pitch, muzzle/nose shift, eyelid change, and subtle ear/whisker follow-through. The torso may lean only slightly; never rotate, skew, or tilt the complete sprite.

The small blue-gray fish stays horizontal directly below the cream belly. Both forepaws remain physically connected to the fish in every look pose. The fish moves with the lower torso and may lag by only a few pixels; it never flips independently, changes size, detaches, crosses to a different height, or hides the face. As the head turns, paw and fish occlusion changes gradually while their belly-centered anchor remains stable.

Motion budget: each 22.5-degree step changes pupils, nose position, head angle, visible cheek/ear area, and whisker direction by a small even amount. Head size, body height, baseline, fish size, and lower-body registration stay constant. Adjacent poses must form one smooth clockwise loop, including 157.5 to 180 and 337.5 to 000.

Cardinal pose families:

- 000 up: chin lifts slightly; pupils and nose aim above the head center; upper muzzle foreshortens; both ears remain visible; belly, paws, and fish stay front-facing and anchored.
- 090 screen-right: pupils and nose tip move unmistakably to screen-right of the head center; the face turns right, the screen-left cheek/ear becomes more visible, and the far eye narrows slightly; fish remains centered below the belly with both paws attached.
- 180 down: chin tucks; pupils and nose aim below the head center toward the held fish; upper eyelids lower slightly; the muzzle may overlap more of the scarf but must not hide the fish or break the two-paw grip.
- 270 screen-left: pupils and nose tip move unmistakably to screen-left of the head center; the face turns left, the screen-right cheek/ear becomes more visible, and the far eye narrows slightly; fish remains centered below the belly with both paws attached.

Diagonals interpolate evenly between the adjacent cardinal families. Preserve Mochi's round face, cream muzzle and belly, teal scarf, warm brown palette, bold outline, eye construction, and the exact small whole-fish design. No replacement eyes, whole-body rotation, detached parts, shadows, effects, labels, or guide marks.
