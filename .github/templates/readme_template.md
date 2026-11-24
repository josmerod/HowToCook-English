# Programmer's Guide to Cooking

> [!NOTE]
> **Disclaimer**: This documentation and its recipes are an English translation of the [original repository](https://github.com/Anduin2017/HowToCook). The goal is to make these guides accessible to non-Chinese speakers.

[![build](https://github.com/josmerod/HowToCook-English/actions/workflows/build.yml/badge.svg)](https://github.com/josmerod/HowToCook-English/actions/workflows/build.yml)
[![CI](https://github.com/josmerod/HowToCook-English/actions/workflows/ci.yml/badge.svg)](https://github.com/josmerod/HowToCook-English/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/josmerod/HowToCook-English)](./LICENSE)
[![GitHub contributors](https://img.shields.io/github/contributors/josmerod/HowToCook-English)](https://github.com/josmerod/HowToCook-English/graphs/contributors)

Recently, I've been cooking at home. As a programmer, I occasionally look for recipes online. However, these recipes often have strange formats and vaguely introduce ingredients in the middle of the process. This is extremely unfriendly to programmers accustomed to formal languages.

Therefore, this project compiles common dish instructions with clearer, more precise descriptions to facilitate programmers cooking at home.

Similarly, this is a community-driven and maintained open-source repository, allowing more people to build a helpful cooking guide together. Contributions are very welcome!

## Local Deployment

If you need to deploy the recipe Web service locally using Docker:

```bash
docker build -t how-to-cook-english .
docker run -d -p 5000:80 how-to-cook-english
```

To read or download the compiled PDF version, see [document.pdf](./document.pdf).

## How to Contribute

For any issues found, please modify and submit a Pull Request directly (see [CONTRIBUTING.md](./CONTRIBUTING.md)).

When writing a new recipe, please copy and modify the existing recipe template: [Sample Dish](./dishes/template/Sample_Dish/Sample_Dish.md).

## Environment Setup

{{before}}

## Recipes

{{index_stars}}

{{main}}

## Advanced Knowledge

If you have mastered many of the dishes above and wish to learn more advanced cooking techniques, please continue reading below:

{{after}}

## Derivative Works

- [Original Repository (Chinese): Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook)
- [Graphical Recipes: Supports online preview and PDF export](https://king-jingxiang.github.io/HowToCook/)
- [HowToCook-mcp: Let AI assistants become your private chef, suggesting your daily meals](https://github.com/worryzyy/HowToCook-mcp)
- [HowToCook-py-mcp: Let AI assistants become your private chef (Python)](https://github.com/DusKing1/howtocook-py-mcp)
- [whatToEat: A decision-making tool for "What to eat today?", helping you quickly choose the right recipe.](https://github.com/ryanuo/whatToEat)
