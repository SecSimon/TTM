import json

fPack = open('package.json', 'r+')
pack = json.load(fPack)
fPackApp = open('app/package.json', 'r+')
packApp = json.load(fPackApp)
fAssetV = open('src/assets/version.json', 'r+')
assetV = json.load(fAssetV)

print('Current version: ')
print('  package.json:' + pack['version'])
print('  app/package.json:' + packApp['version'])
print('  version.json:' + assetV['version'])
print('')
print('Update')
print('1) Major version')
print('2) Minor version')
print('3) Patch version')
print('4) Input verison')

isValid = False
newV = pack['version']
while (not isValid):
    up = input()
    isValid = True
    index = -1
    if (up == '1'):
        index = 0
    elif (up == '2'):
        index = 1
    elif (up == '3'):
        index = 2
    elif (up == '4'):
        newV = input('Set version: ')
    else:
        print('Invalid, try again')
        isValid = False
    
    if isValid and index >= 0:
        nums = pack['version'].split('.')
        nums[index] = str(int(nums[index])+1)
        for i in range(index+1, len(nums)):
            nums[i] = '0'
        newV = '.'.join(nums)
    print('Set new version: ' + newV)
    pack['version'] = newV
    packApp['version'] = newV
    assetV['version'] = newV
    fPack.seek(0)
    fPackApp.seek(0)
    fAssetV.seek(0)
    json.dump(pack, fPack, indent=2)
    json.dump(packApp, fPackApp, indent=2)
    json.dump(assetV, fAssetV, indent=2)
    fPack.close()
    fPackApp.close()
    fAssetV.close()
