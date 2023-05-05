import { ApiObject, GroupVersionKind } from 'cdk8s';
import { Construct } from 'constructs';
import * as k8s from './imports/k8s';
export * as k8s from './imports/k8s';

export interface AnalysisTemplate {
  readonly templateName: string;
};

export interface ValueFrom {
  readonly podTemplateHashValue?: string;
  readonly fieldRef?: k8s.ObjectFieldSelector;
};

export interface AnalysisArgs {
  readonly name: string;
  readonly value?: string;
  readonly valueFrom?: ValueFrom;
};

export interface AnalysisSpec {
  readonly templates: AnalysisTemplate[];
  readonly args: AnalysisArgs[];
};

export type MatchTypes =
    {
      exact: string
    } |
    {
      regex: string;
    } |
    {
      prefix: string;
    };

export type CanaryStep = 
  {
    setWeight: number;
  } | 
  {
    pause: { 
      duration?: string;
    }
  } |
  {
    analysis: AnalysisSpec
  } |
  {
    experiment: {
      duration: string;
      templates: { name: string; specRef: string }[];
      analyses: { name: string; templateName: string }[];
    }
  } |
  {
    setCanaryScale: 
      {
        replicas: number
      } |
      {
        weight: number
      } |
      {
        matchTrafficWeight: boolean
      }
  } |
  {
    setHeaderRoute: {
      name: string;
      match: {
        headerName: string;
        headerValue: MatchTypes;
      }
    }
  } |
  {
    setMirrorRoute: {
      name: string;
      percentage: number;
      match: {
          method: MatchTypes;
          path: MatchTypes;
          headers: {
            [key: string]: MatchTypes;
          }
      }[]
    }
  }
  

export interface StrategySpecs {
  readonly scaleDownDelaySeconds?: number;
  readonly scaleDownDelayRevisionLimit?: number;
  readonly antiAffinity?: k8s.PodAntiAffinity;
  readonly abortScaleDownDelaySeconds?: number;
}

export interface BlueGreenStrategySpecs extends StrategySpecs {
  readonly activeService: string;
  readonly prePromotionAnalysis?: AnalysisSpec;
  readonly postPromotionAnalysis?: AnalysisSpec;
  readonly previewService?: string;
  readonly previewReplicaCount?: number;
  readonly autoPromotionEnabled?: boolean;
  readonly autoPromotionSeconds?: number;
}

export interface CanaryStrategySpecs extends StrategySpecs {
   readonly canaryService?: string;
   readonly stableService?: string;
   readonly canaryMetadata?: k8s.ObjectMeta;
   readonly stableMetadata?: k8s.ObjectMeta;
   readonly maxUnavailable?: number;
   readonly maxSurge?: string;
   readonly minPodsPerReplicaSet?: number;
   readonly analysis?: AnalysisSpec;
   readonly steps?: CanaryStep[]; //TODO: add type for steps
   readonly TrafficRoutingParams?: {
    nginx?: {
      stableIngresses?: string[];
      annotationPrefix?: string;
      additionalIngressAnnotations?: {
        'canary-by-header': string;
        'canary-by-header-value:': string;
      }
     }
   }
}

export interface StrategySpecs {
  readonly blueGreen?: BlueGreenStrategySpecs;
  canary?: CanaryStrategySpecs;
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
    let rolloutProps: any = props;
    if(props.spec) {
      if(props.spec.strategy.canary && props.spec.strategy.blueGreen) throw new Error('Strategy can be canary or bluegreen but not both');
      if(props.spec.strategy.canary) {
        if(props.spec.strategy.canary.TrafficRoutingParams) {
          if (!props.spec.strategy.canary.canaryService) {
            throw new Error('When Traffic routing is configured, the property canaryService is required');
          }
          if(!props.spec.strategy.canary.stableService) {
            throw new Error('When Traffic routing is configured, the property stableService is required');
          }
        }
        rolloutProps = {
          canary: {
            canaryService: props.spec.strategy.canary.canaryService,
            stableService: props.spec.strategy.canary.stableService,
            canaryMetadata: props.spec.strategy.canary.canaryMetadata ?? {
              annotations: {
                role: 'canary'
              },
              labels: {
                role: 'canary'
              }
            },
            stableMetadata: props.spec.strategy.canary.stableMetadata ?? {
              annotations: {
                role: 'stable'
              },
              labels: {
                role: 'stable'
              }
            },
            maxUnavailable: props.spec.strategy.canary.maxUnavailable ?? 1,
            maxSurge: props.spec.strategy.canary.maxSurge ?? "20%",
            scaleDownDelaySeconds: props.spec.strategy.canary.scaleDownDelaySeconds ?? 30,
            minPodsPerReplicaSet: props.spec.strategy.canary.minPodsPerReplicaSet ?? (props.spec.strategy.canary.TrafficRoutingParams ? 2 : 1),
            scaleDownDelayRevisionLimit: props.spec.strategy.canary.scaleDownDelayRevisionLimit,
            analysis: props.spec.strategy.canary.analysis,
            steps: props.spec.strategy.canary.steps,
            antiAffinity: props.spec.strategy.canary.antiAffinity,
            trafficRouting: props.spec.strategy.canary.TrafficRoutingParams,
            abortScaleDownDelaySeconds: props.spec.strategy.canary.abortScaleDownDelaySeconds ?? 30
          }
        }
      }
    }

    return {
      ...ArgoRollout.GVK,
      ...rolloutProps,
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
