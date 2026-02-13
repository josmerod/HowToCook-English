# How to Decide What to Eat

Deciding what to eat is also a big problem for me before cooking. Since I am a programmer, I can only describe it with mathematics.

## Calculation Method

### Calculate the Number of Meat and Vegetable Dishes

* Number of dishes = Number of people + 1.
* The number of meat dishes should be one more than, or equal to, the number of vegetable dishes.

From this, obtain the number of meat dishes and vegetable dishes, and then choose from the recipe list in the previous step.

#### Formal Language Description

When there are `N` people,
Let `Veg` be the number of vegetable dishes, and `Meat` be the number of meat dishes.
`N`, `Veg`, and `Meat` are all integers.

At this time, we have the following inequality group:

* Veg + Meat = N + 1
* Veg ≤ Meat ≤ Veg + 1

Solving this:

```javascript
const Veg = Math.floor((N+1)/2);
const Meat = Math.ceil((N+1)/2);
```

### Choice of Dishes

* If there are more than 8 people, consider adding fish to the meat dishes.
* If there are children, consider adding sweet dishes.
* Consider adding specialty dishes or signature dishes.
* When deciding on meat dishes, do not use the same animal for all of them. The priority order is: `Pork`, `Chicken`, `Beef`, `Lamb`, `Duck`, `Fish`.
* Do not choose strange animals for meat dishes.

If you are still unsure, please use the [What To Eat Today?](https://github.com/ryanuo/whatToEat) tool to help you choose.
