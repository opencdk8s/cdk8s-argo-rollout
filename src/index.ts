import { ApiObject, GroupVersionKind } from 'cdk8s';
import { Construct } from 'constructs';
import * as k8s from './imports/k8s';
export * as k8s from './imports/k8s';

export interface AnalysisTemplate {
  readonly templateName: string;
}

export interface ValueFrom {
  readonly podTemplateHashValue?: string;
  readonly fieldRef?: k8s.ObjectFieldSelector;
}

export interface AnalysisArgs {
  readonly name: string;
  readonly value?: string;
  readonly valueFrom?: ValueFrom;
}

export interface AnalysisSpec {
  readonly templates: AnalysisTemplate[];
  readonly args: AnalysisArgs[];
}

// export type CanaryStep = {
//   setWeight: number;
// } | {
//   pause: { duration?: string }
// } | {
//   setCanaryScale: {
//     replicas: number
//   } | {
//     weight: number
//   } | {
//     matchTrafficWeight: boolean
//   }
// } | {
//   analysis: AnalysisSpec
// } | {
//   experiment: {
//     duration: string;
//     templates: { name: string; specRef: string }[];
//     analyses: { name: string; templateName: string }[];
//   }
// };

export interface BlueGreenStrategySpecs {
  readonly activeService: string;
  readonly prePromotionAnalysis?: AnalysisSpec;
  readonly postPromotionAnalysis?: AnalysisSpec;
  readonly previewService?: string;
  readonly previewReplicaCount?: number;
  readonly autoPromotionEnabled?: boolean;
  readonly autoPromotionSeconds?: number;
  readonly scaleDownDelaySeconds?: number;
  readonly scaleDownDelayRevisionLimit?: number;
  readonly antiAffinity?: k8s.PodAntiAffinity;
}

// export interface CanaryStrategySpecs {
//   readonly canaryService: string;
//   readonly stableService: string;
//   readonly canaryMetadata: k8s.ObjectMeta;
//   readonly maxUnavailable?: number;
//   readonly maxSurge?: string;
//   readonly analysis: AnalysisSpec;
//   readonly steps: any[]; //TODO: add type for steps
// }

export interface StrategySpecs {
  readonly blueGreen: BlueGreenStrategySpecs;
  // readonly canary?: CanaryStrategySpecs;
}

export interface ArgoSpecs {
  readonly strategy: StrategySpecs;
  readonly minReadySeconds?: number;
  readonly paused?: boolean;
  readonly progressDeadlineSeconds?: number;
  readonly replicas?: number;
  readonly revisionHistoryLimit?: number;
  readonly selector: k8s.LabelSelector;
  readonly template: k8s.PodTemplateSpec;
}

export interface ArgoRolloutProps {
  /**
   * Standard object's metadata.
   *
   */
  readonly metadata?: k8s.ObjectMeta;

  /**
   * Spec defines the behavior of the ingress
   *
   */
  readonly spec?: ArgoSpecs;
}

export class ArgoRollout extends ApiObject {
  public static readonly GVK: GroupVersionKind = {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'Rollout',
  };
  /**
   * Renders a Kubernetes manifest for an ingress object. https://github.com/kubernetes-sigs/aws-load-balancer-controller
   *
   * This can be used to inline resource manifests inside other objects (e.g. as templates).
   *
   * @param props initialization props
   */
  public static manifest(props: ArgoRolloutProps): any {
    return {
      ...ArgoRollout.GVK,
      ...props,
    };
  }

  /**
   * Defines an "extentions" API object for AWS Load Balancer Controller - https://github.com/kubernetes-sigs/aws-load-balancer-controller
   * @param scope the scope in which to define this object
   * @param id a scope-local name for the object
   * @param props initialization props
   */
  public constructor(scope: Construct, id: string, props: ArgoRolloutProps) {
    super(scope, id, ArgoRollout.manifest(props));
  }
}
