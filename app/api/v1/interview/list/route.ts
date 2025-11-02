import { NextResponse } from 'next/server';

// Mock data for interview list
const mockInterviewData =
  {
    "name": null,
    "description": null,
    "goal": {
      "product_name": "Dreemo",
      "target_users": "年轻女性用户",
      "business_type": "笔记",
      "research_goal": "了解用户使用习惯"
    },
    "proposal": null,
    "outline": {
      "sections": [
        {
          "name": "热身与背景",
          "questions": [
            {
              "main": "请您简单介绍一下自己，以及您是如何开始使用Dreemo的？",
              "probes": [
                "是什么吸引您开始使用Dreemo？",
                "您通常在什么场景下使用Dreemo？"
              ]
            },
            {
              "main": "您平时使用Dreemo的频率如何？",
              "probes": [
                "您通常在一天中的哪个时间段使用Dreemo？",
                "使用Dreemo的时长一般是多少？"
              ]
            }
          ]
        },
        {
          "name": "现状与痛点",
          "questions": [
            {
              "main": "在使用Dreemo记录笔记的过程中，您遇到过哪些困难或不便？",
              "probes": [
                "有没有哪次使用体验让您感到特别不满意？",
                "您认为哪些功能或环节最费力或容易出错？"
              ]
            },
            {
              "main": "您觉得Dreemo在哪些方面还可以改进以更好地满足您的需求？",
              "probes": [
                "有没有您希望Dreemo增加的功能？",
                "在使用过程中，您有没有感到哪些功能不够直观或易用？"
              ]
            }
          ]
        },
        {
          "name": "动机与优先级",
          "questions": [
            {
              "main": "您使用Dreemo的主要目的是什么？",
              "probes": [
                "在记录笔记时，您最看重哪些功能？",
                "如果只能保留一个功能，您会选择哪个？为什么？"
              ]
            },
            {
              "main": "在使用Dreemo时，您会优先完成哪些任务？",
              "probes": [
                "这些任务对您的重要性如何排序？",
                "您是如何决定使用Dreemo的频率和时长的？"
              ]
            }
          ]
        },
        {
          "name": "期望与理想",
          "questions": [
            {
              "main": "在理想状态下，您希望Dreemo能为您提供哪些功能或服务？",
              "probes": [
                "您认为怎样的结果能体现Dreemo的成功？",
                "如果可以，您希望Dreemo在未来增加哪些新特性？"
              ]
            },
            {
              "main": "您对Dreemo未来的发展有什么建议或期待？",
              "probes": [
                "您希望Dreemo在用户体验上有哪些突破？",
                "在功能扩展方面，您有什么具体的想法？"
              ]
            }
          ]
        },
        {
          "name": "收束与补充",
          "questions": [
            {
              "main": "在今天的访谈中，您还有什么想补充的关于Dreemo的使用体验吗？",
              "probes": [
                "有没有我们没有提到但您认为重要的方面？",
                "您还有其他建议或意见吗？"
              ]
            }
          ]
        }
      ],
      "opening_script": {
        "introduction": "您好，感谢您参加此次关于Dreemo笔记应用的访谈。我们希望通过了解您的使用习惯来优化产品体验。此次访谈大约需要30分钟，您的回答将被严格保密，并仅用于研究目的。我们会录音以便后续分析，您可以随时要求停止录音。请问您同意继续吗？"
      }
    },
    "questionnaire": null,
    "duration": 1620,
    "organization_id": null,
    "user_id": 2,
    "project_id": null,
    "state": 3,
    "id": 1,
    "created_at": "2025-10-26T13:48:35.235389Z"
  };

// Don't cache the results
export const revalidate = 0;

export async function GET() {
  try {
    return NextResponse.json(mockInterviewData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in /api/v1/interview/list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}