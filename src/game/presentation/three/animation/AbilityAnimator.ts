import { gsap } from 'gsap'
import * as THREE from 'three'
import type { AnimationResult } from '../../../core/flow/GamePresentation.ts'
import type { AbilityPlan, AbilityRotationGroup } from '../../../core/ability/AbilityPlanner.ts'
import type { CubeBoardView } from '../board/CubeBoardView.ts'
import type { Cube } from '../board/Cube.ts'
import { CubeShakeAnimator } from './CubeShakeAnimator.ts'
import { TimelineScope } from './TimelineScope.ts'

interface CubeSnapshot {
  cube: Cube
  position: THREE.Vector3
  rotation: THREE.Euler
}

interface AbilityPreview {
  plan: AbilityPlan
  snapshots: CubeSnapshot[]
  currentTurns: number
  rotationPivots: RotationPivot[]
}

interface RotationPivot {
  group: THREE.Group
  direction: 1 | -1
}

export class AbilityAnimator {
  private readonly scope = new TimelineScope()
  private readonly board: CubeBoardView
  private readonly duration = 0.45
  private readonly rotationAxis = new THREE.Vector3()
  private readonly center = new THREE.Vector3()
  private readonly offset = new THREE.Vector3()
  private readonly rotatedOffset = new THREE.Vector3()
  private previewState: AbilityPreview | null = null
  private previewTimeline: gsap.core.Timeline | null = null
  private readonly shake: CubeShakeAnimator

  constructor(board: CubeBoardView, shake: CubeShakeAnimator) {
    this.board = board
    this.shake = shake
  }

  preview(
    plan: AbilityPlan,
    mode: 'selection' | 'rotation' = 'rotation',
  ): Promise<AnimationResult> {
    this.stopPreviewTimeline()
    const hasSamePieces =
      this.previewState !== null && this.hasSamePieces(this.previewState.plan, plan)

    if (!hasSamePieces) {
      this.clearPreview()
      const snapshots = this.createSnapshots(plan)
      this.prepareCubes(snapshots)
      this.previewState = {
        plan,
        snapshots,
        currentTurns: 0,
        rotationPivots: this.createRotationPivots(plan),
      }
    } else if (this.previewState) {
      this.previewState.plan = plan
    }

    if (plan.command.type !== 'rotateSegment') {
      return Promise.resolve('completed')
    }
    const fromTurns = this.previewState?.currentTurns ?? 0
    const targetTurns =
      mode === 'selection'
        ? 0
        : this.getContinuousTargetTurns(fromTurns, this.getPlanQuarterTurns(plan))

    if (fromTurns === targetTurns) {
      if (targetTurns === 0) this.startSelectionEffect(plan)
      return Promise.resolve('completed')
    }

    const progress = { value: 0 }
    return new Promise<AnimationResult>((resolve) => {
      let settled = false
      const finish = (result: AnimationResult): void => {
        if (settled) return
        settled = true
        resolve(result)
      }

      this.previewTimeline = gsap.timeline({
        onComplete: () => {
          if (this.previewState) this.previewState.currentTurns = targetTurns
          this.previewTimeline = null
          finish('completed')
        },
        onInterrupt: () => {
          this.previewTimeline = null
          finish('cancelled')
        },
      })
      this.previewTimeline.to(progress, {
        value: 1,
        duration: 0.42,
        ease: 'power2.inOut',
        onUpdate: () => {
          const turns = THREE.MathUtils.lerp(fromTurns, targetTurns, progress.value)
          if (this.previewState) this.previewState.currentTurns = turns
          this.applyRotateTurns(plan, turns)
        },
      })
      this.previewTimeline.play(0)
    })
  }

  clearPreview(): void {
    this.stopPreviewTimeline()
    if (!this.previewState) return
    const { plan, snapshots, rotationPivots } = this.previewState
    this.stopSelectionEffect(plan)
    this.restore(plan, snapshots, rotationPivots)
    this.previewState = null
  }

  play(plan: AbilityPlan): Promise<AnimationResult> {
    const isPreviewed = this.previewState?.plan === plan
    // The preview tween may still be running when the player presses Apply.
    // It must not continue writing transforms while the final animation is
    // committing the ability result.
    if (isPreviewed) this.stopPreviewTimeline()
    const snapshots = isPreviewed
      ? (this.previewState?.snapshots ?? this.createSnapshots(plan))
      : this.createSnapshots(plan)
    const timeline = gsap.timeline({ paused: true })

    if (!isPreviewed) this.prepareCubes(snapshots)
    if (isPreviewed) this.stopSelectionEffect(plan, 0.12)

    if (plan.command.type === 'convert') {
      this.addConvertAnimation(timeline, plan)
    } else if (plan.command.type === 'swap') {
      this.addSwapAnimation(timeline, plan)
    } else {
      this.addRotateAnimation(timeline, plan, isPreviewed)
    }

    return this.scope
      .play(timeline)
      .then((result) => {
        if (result === 'completed') {
          this.finish(plan)
        } else {
          this.restore(plan, snapshots, this.previewState?.rotationPivots ?? [])
        }
        if (isPreviewed) this.previewState = null
        return result
      })
      .catch((error: unknown) => {
        this.restore(plan, snapshots, this.previewState?.rotationPivots ?? [])
        if (isPreviewed) this.previewState = null
        throw error
      })
  }

  destroy(): void {
    this.scope.dispose()
    this.clearPreview()
  }

  private addConvertAnimation(timeline: gsap.core.Timeline, plan: AbilityPlan): void {
    plan.typeChanges.forEach(({ piece }, index) => {
      const cube = this.board.getCube(piece)
      const start = index * 0.04
      timeline
        .to(
          cube.scale,
          {
            x: 1.15,
            y: 1.15,
            z: 1.15,
            duration: 0.14,
            ease: 'power2.out',
          },
          start,
        )
        .call(
          () => {
            const change = plan.typeChanges.find(({ piece: changed }) => changed === piece)
            if (change) this.board.setVisualElementType(piece, change.to)
          },
          [],
          start + 0.14,
        )
        .to(
          cube.scale,
          {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.18,
            ease: 'back.out(1.5)',
          },
          start + 0.14,
        )
    })
  }

  private addSwapAnimation(timeline: gsap.core.Timeline, plan: AbilityPlan): void {
    plan.positionChanges.forEach(({ piece, to }) => {
      const cube = this.board.getCube(piece)
      const target = this.board.getLocalPosition(to)
      timeline.to(
        cube.position,
        {
          x: target.x,
          y: target.y,
          z: target.z,
          duration: this.duration,
          ease: 'power2.inOut',
        },
        0,
      )
    })
  }

  private addRotateAnimation(
    timeline: gsap.core.Timeline,
    plan: AbilityPlan,
    isPreviewed: boolean,
  ): void {
    if (plan.positionChanges.length === 0) return
    if (plan.command.type !== 'rotateSegment') return

    if (isPreviewed) {
      const currentTurns = this.previewState?.currentTurns ?? 0
      const targetTurns = this.getContinuousTargetTurns(
        currentTurns,
        this.getPlanQuarterTurns(plan),
      )
      if (currentTurns !== targetTurns) {
        const progress = { value: 0 }
        timeline.to(progress, {
          value: 1,
          duration: this.duration,
          ease: 'power2.inOut',
          onUpdate: () =>
            this.applyRotateTurns(
              plan,
              currentTurns + (targetTurns - currentTurns) * progress.value,
            ),
        })
      }
      timeline
        .to(
          plan.pieces.map((piece) => this.board.getCube(piece).scale),
          {
            x: 1.08,
            y: 1.08,
            z: 1.08,
            duration: 0.12,
            ease: 'power2.out',
          },
          0,
        )
        .to(
          plan.pieces.map((piece) => this.board.getCube(piece).scale),
          {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.2,
            ease: 'back.out(1.5)',
          },
          0.12,
        )
      return
    }

    const progress = { value: 0 }

    timeline.to(progress, {
      value: 1,
      duration: this.duration,
      ease: 'power2.inOut',
      onUpdate: () => this.applyRotateProgress(plan, progress.value),
    })
  }

  private applyRotateProgress(plan: AbilityPlan, progress: number): void {
    if (plan.command.type !== 'rotateSegment') return
    this.applyRotateTurns(plan, this.getPlanQuarterTurns(plan) * progress)
  }

  private applyRotateTurns(plan: AbilityPlan, turns: number): void {
    if (plan.command.type !== 'rotateSegment') return
    const { axis } = plan.command
    const axisDirection = this.getVisualAxisDirection(axis)

    if (this.previewState && this.previewState.rotationPivots.length > 0) {
      this.previewState.rotationPivots.forEach(({ group, direction }) => {
        group.rotation.set(0, 0, 0)
        this.setAxis(group.rotation, axis, Math.PI * 0.5 * turns * direction * axisDirection)
      })
      return
    }

    this.getRotationGroups(plan).forEach((group) => {
      this.rotationAxis.set(0, 0, 0)
      this.setAxis(this.rotationAxis, axis, 1)
      this.center.set(0, 0, 0)
      group.positionChanges.forEach(({ from }) => {
        this.center.add(this.board.getLocalPosition(from))
      })
      this.center.multiplyScalar(1 / group.positionChanges.length)

      const angle = Math.PI * 0.5 * turns * group.direction * axisDirection
      group.positionChanges.forEach(({ piece, from }) => {
        const cube = this.board.getCube(piece)
        const start = this.board.getLocalPosition(from)
        this.offset.copy(start).sub(this.center)
        this.rotatedOffset.copy(this.offset).applyAxisAngle(this.rotationAxis, angle)
        cube.position.copy(this.center).add(this.rotatedOffset)
        cube.rotation.set(0, 0, 0)
        this.setAxis(cube.rotation, axis, angle)
      })
    })
  }

  private prepareCubes(snapshots: readonly CubeSnapshot[]): void {
    snapshots.forEach(({ cube }) => {
      gsap.killTweensOf([cube.position, cube.rotation, cube.scale])
      cube.rotation.set(0, 0, 0)
      cube.scale.set(1, 1, 1)
    })
  }

  private startSelectionEffect(plan: AbilityPlan): void {
    if (plan.command.type !== 'rotateSegment') return
    plan.pieces.forEach((piece) => {
      const cube = this.board.getCube(piece)
      this.shake.startLoop(cube, 0.08)
      gsap.to(cube.scale, {
        x: 1.12,
        y: 1.12,
        z: 1.12,
        duration: 0.16,
        ease: 'back.out(1.5)',
      })
    })
  }

  private stopSelectionEffect(plan: AbilityPlan, resetDuration = 0): void {
    if (plan.command.type !== 'rotateSegment') return
    plan.pieces.forEach((piece) => {
      const cube = this.board.getCube(piece)
      this.shake.stop(cube, resetDuration)
      gsap.killTweensOf(cube.scale)
      cube.scale.set(1, 1, 1)
    })
  }

  private stopPreviewTimeline(): void {
    this.previewTimeline?.kill()
    this.previewTimeline = null
  }

  private hasSamePieces(first: AbilityPlan, second: AbilityPlan): boolean {
    if (first.pieces.length !== second.pieces.length) return false
    const firstIds = new Set(first.pieces.map((piece) => piece.id))
    return second.pieces.every((piece) => firstIds.has(piece.id))
  }

  private getContinuousTargetTurns(fromTurns: number, targetTurns: 0 | 1 | 2 | 3): number {
    let target = targetTurns
    while (target < fromTurns) target += 4
    return target
  }

  private createSnapshots(plan: AbilityPlan): CubeSnapshot[] {
    return plan.pieces.map((piece) => {
      const cube = this.board.getCube(piece)
      return {
        cube,
        position: cube.position.clone(),
        rotation: cube.rotation.clone(),
      }
    })
  }

  private finish(plan: AbilityPlan): void {
    const rotationPivots = this.previewState?.rotationPivots ?? []
    this.detachRotationPivots(rotationPivots)

    if (plan.command.type === 'rotateSegment') {
      const axis = plan.command.axis
      const axisDirection = this.getVisualAxisDirection(axis)
      this.getRotationGroups(plan).forEach((group) => {
        const turns = group.quarterTurns
        group.positionChanges.forEach(({ piece, to }) => {
          const cube = this.board.getCube(piece)
          cube.position.copy(this.board.getLocalPosition(to))
          cube.rotation.set(0, 0, 0)
          this.setAxis(cube.rotation, axis, Math.PI * 0.5 * turns * group.direction * axisDirection)
        })
      })
      return
    }

    plan.positionChanges.forEach(({ piece, to }) => {
      this.board.getCube(piece).position.copy(this.board.getLocalPosition(to))
    })
  }

  private restore(
    plan: AbilityPlan,
    snapshots: readonly CubeSnapshot[],
    rotationPivots: readonly RotationPivot[] = [],
  ): void {
    this.detachRotationPivots(rotationPivots)
    plan.typeChanges.forEach(({ piece, from }) => {
      this.board.setVisualElementType(piece, from)
    })
    snapshots.forEach(({ cube, position, rotation }) => {
      cube.position.copy(position)
      cube.rotation.copy(rotation)
      cube.scale.set(1, 1, 1)
    })
  }

  private createRotationPivots(plan: AbilityPlan): RotationPivot[] {
    if (plan.command.type !== 'rotateSegment') return []

    return this.getRotationGroups(plan).map((rotationGroup) => {
      this.center.set(0, 0, 0)
      rotationGroup.positionChanges.forEach(({ from }) => {
        this.center.add(this.board.getLocalPosition(from))
      })
      this.center.multiplyScalar(1 / rotationGroup.positionChanges.length)

      const group = new THREE.Group()
      group.position.copy(this.center)
      this.board.object.add(group)
      rotationGroup.positionChanges.forEach(({ piece, from }) => {
        const cube = this.board.getCube(piece)
        group.add(cube)
        cube.position.copy(this.board.getLocalPosition(from)).sub(this.center)
      })
      return { group, direction: rotationGroup.direction }
    })
  }

  private detachRotationPivots(rotationPivots: readonly RotationPivot[]): void {
    rotationPivots.forEach(({ group }) => {
      Array.from(group.children).forEach((child) => this.board.object.add(child))
      group.removeFromParent()
    })
  }

  private getRotationGroups(plan: AbilityPlan): AbilityRotationGroup[] {
    if (plan.rotationGroups && plan.rotationGroups.length > 0) return plan.rotationGroups
    return [
      {
        pieces: plan.pieces,
        positionChanges: plan.positionChanges,
        direction: 1,
        quarterTurns: this.getPlanQuarterTurns(plan),
      },
    ]
  }

  private getPlanQuarterTurns(plan: AbilityPlan): 0 | 1 | 2 | 3 {
    if (plan.command.type === 'rotateSegment') {
      return plan.command.segments[0]?.quarterTurns ?? 0
    }
    return 0
  }

  private getVisualAxisDirection(axis: 'x' | 'y' | 'z'): 1 | -1 {
    // Board rotations are defined in the (u, v) plane. The y plane maps to
    // Three.js' right-handed rotation directly, while x and z have the
    // opposite handedness because of their plane-coordinate ordering.
    return axis === 'y' ? 1 : -1
  }

  private setAxis(target: THREE.Vector3 | THREE.Euler, axis: 'x' | 'y' | 'z', value: number): void {
    switch (axis) {
      case 'x':
        target.x = value
        return
      case 'y':
        target.y = value
        return
      case 'z':
        target.z = value
        return
    }
  }
}
